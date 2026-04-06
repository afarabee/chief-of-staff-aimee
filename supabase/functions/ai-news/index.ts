import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BLOCKED_HOSTS = [
  "google.com",
  "google.co",
  "googleapis.com",
  "googleusercontent.com",
  "vertexaisearch.cloud.google.com",
];

function isBlockedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BLOCKED_HOSTS.some(
      (blocked) => hostname === blocked || hostname.endsWith("." + blocked)
    );
  } catch {
    return true;
  }
}

async function resolveUrl(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    // Follow redirects to get final destination
    const resp = await fetch(url, { method: "HEAD", redirect: "follow" });
    const finalUrl = resp.url || url;
    if (!isBlockedUrl(finalUrl)) return finalUrl;
  } catch {
    // If HEAD fails, try the original
  }
  // If original isn't blocked, return it
  if (!isBlockedUrl(url)) return url;
  return null;
}

async function sanitizeArticleUrl(rawUrl: string | null | undefined): Promise<string | null> {
  if (!rawUrl) return null;
  if (!isBlockedUrl(rawUrl)) return rawUrl;
  // Try to resolve redirects server-side
  return await resolveUrl(rawUrl);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY not configured");

    const today = new Date().toISOString().slice(0, 10);

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `What are the top 5 AI and technology news stories as of ${today}? For each story, provide the headline, source publication name, a 1-2 sentence summary, and the direct URL to the article. Return ONLY a JSON array with objects having these fields: title, source, snippet, url. No markdown, no explanation, just the JSON array.`,
                },
              ],
            },
          ],
          tools: [{ google_search: {} }],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data).slice(0, 2000));

    // Extract grounding URLs from metadata
    const groundingChunks =
      data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingUrls: string[] = groundingChunks
      .map((c: any) => c.web?.uri)
      .filter(Boolean);

    // Parse the text response for articles
    const textContent =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let articles: any[] = [];
    try {
      const cleaned = textContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();
      articles = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse articles from text:", e);
      const match = textContent.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          articles = JSON.parse(match[0]);
        } catch {
          console.error("Fallback JSON parse also failed");
        }
      }
    }

    if (!Array.isArray(articles)) articles = [];

    // Sanitize URLs: resolve redirects and strip Google-hosted URLs
    const sanitized = await Promise.all(
      articles.slice(0, 5).map(async (a: any, i: number) => {
        const candidateUrl = a.url || groundingUrls[i] || null;
        const safeUrl = await sanitizeArticleUrl(candidateUrl);
        return {
          title: a.title || "Untitled",
          source: a.source || "Unknown",
          snippet: a.snippet || "",
          url: safeUrl,
        };
      })
    );

    // Verify URLs are actually reachable
    const verified = await Promise.all(
      sanitized.map(async (article) => {
        if (!article.url) return article;
        try {
          const resp = await fetch(article.url, {
            method: "HEAD",
            redirect: "follow",
            signal: AbortSignal.timeout(5000),
          });
          if (resp.status < 400) {
            console.log("URL OK:", article.url);
            return article;
          }
          console.log("URL failed status", resp.status, article.url);
          return { ...article, url: null };
        } catch (e) {
          console.log("URL unreachable:", article.url, e);
          return { ...article, url: null };
        }
      })
    );

    return new Response(JSON.stringify({ articles: verified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-news error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
