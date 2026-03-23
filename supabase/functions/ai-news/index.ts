import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY not configured");

    const today = new Date().toISOString().slice(0, 10);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      // Strip markdown code fences if present
      const cleaned = textContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();
      articles = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse articles from text:", e);
      // Try to extract JSON array from the text
      const match = textContent.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          articles = JSON.parse(match[0]);
        } catch {
          console.error("Fallback JSON parse also failed");
        }
      }
    }

    // Ensure articles is an array and enrich with grounding URLs if missing
    if (!Array.isArray(articles)) articles = [];

    articles = articles.slice(0, 5).map((a: any, i: number) => ({
      title: a.title || "Untitled",
      source: a.source || "Unknown",
      snippet: a.snippet || "",
      url: a.url || groundingUrls[i] || null,
    }));

    return new Response(JSON.stringify({ articles }), {
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
