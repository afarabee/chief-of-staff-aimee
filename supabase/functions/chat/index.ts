import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, assets, history } = await req.json();
    console.log("Chat request received. Message length:", message?.length, "Assets:", assets?.length, "History:", history?.length);

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt with asset context
    let assetContext = "";
    if (assets && assets.length > 0) {
      assetContext = "\n\nThe user owns the following assets:\n" +
        assets.map((a: any) => {
          const parts = [`- ${a.name}`];
          if (a.categoryName) parts.push(`(Category: ${a.categoryName})`);
          if (a.description) parts.push(`— ${a.description}`);
          if (a.purchaseDate) parts.push(`[Purchased: ${a.purchaseDate}]`);
          return parts.join(" ");
        }).join("\n");
    }

    const systemPrompt = `You are a helpful personal assistant for home and asset maintenance. You give practical, specific advice about maintaining properties, vehicles, boats, appliances, and other assets.${assetContext}

When answering questions:
- Be specific and practical
- Reference the user's actual assets when relevant
- Suggest maintenance schedules when appropriate
- If asked about an asset you know about, tailor your answer to that specific make/model/type
- Keep answers concise but thorough
- If you don't know something specific, say so rather than guessing`;

    // Build Gemini conversation contents
    const contents: any[] = [];

    // Add history
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current user message
    contents.push({ role: "user", parts: [{ text: message }] });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    console.log("Calling Gemini API...");
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
    console.log("Gemini reply length:", reply.length);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
