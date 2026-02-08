import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildAssetSection(assets: any[]): string {
  if (!assets?.length) return "";
  const lines = assets.map((a) => {
    const parts = [`- ${a.name}`];
    if (a.categoryName) parts.push(`(${a.categoryName})`);
    if (a.description) parts.push(`— ${a.description}`);
    if (a.purchaseDate) parts.push(`[Purchased: ${a.purchaseDate}]`);
    return parts.join(" ");
  });
  return `\nASSETS (things the user owns):\n${lines.join("\n")}`;
}

function buildTaskSection(tasks: any[]): string {
  if (!tasks?.length) return "";
  const lines = tasks.map((t) => {
    const parts = [`- ${t.title} [Status: ${t.status || "Unknown"}, Priority: ${t.priority || "Medium"}]`];
    if (t.dueDate) parts.push(`Due: ${t.dueDate}`);
    if (t.categoryName) parts.push(`Category: ${t.categoryName}`);
    if (t.description) parts.push(`— ${t.description}`);
    return parts.join(" ");
  });
  return `\nKANBAN TASKS (ad-hoc/personal tasks):\n${lines.join("\n")}`;
}

function buildIdeaSection(ideas: any[]): string {
  if (!ideas?.length) return "";
  const lines = ideas.map((i) => {
    const parts = [`- ${i.title} [Status: ${i.status || "New"}]`];
    if (i.description) parts.push(`— ${i.description}`);
    return parts.join(" ");
  });
  return `\nIDEAS:\n${lines.join("\n")}`;
}

function buildMaintenanceSection(tasks: any[]): string {
  if (!tasks?.length) return "";
  const lines = tasks.map((t) => {
    const parts = [`- ${t.name} [Status: ${t.status || "pending"}]`];
    if (t.assetName) parts.push(`Asset: ${t.assetName}`);
    if (t.nextDueDate) parts.push(`Due: ${t.nextDueDate}`);
    if (t.recurrenceRule) parts.push(`Recurrence: ${t.recurrenceRule}`);
    if (t.providerName) parts.push(`Provider: ${t.providerName}`);
    return parts.join(" ");
  });
  return `\nMAINTENANCE TASKS (asset-related recurring/scheduled tasks):\n${lines.join("\n")}`;
}

function buildProviderSection(providers: any[]): string {
  if (!providers?.length) return "";
  const lines = providers.map((p) => {
    const parts = [`- ${p.name}`];
    if (p.categoryName) parts.push(`(${p.categoryName})`);
    if (p.phone) parts.push(`Phone: ${p.phone}`);
    if (p.email) parts.push(`Email: ${p.email}`);
    return parts.join(" ");
  });
  return `\nSERVICE PROVIDERS:\n${lines.join("\n")}`;
}

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

    const body = await req.json();
    const message = body.message;
    const history = body.history || [];
    // Support both old { assets } and new { context } format
    const context = body.context || {};
    const assets = context.assets || body.assets || [];

    console.log("Chat request. Message length:", message?.length, "Context keys:", Object.keys(context));

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataSections = [
      buildAssetSection(assets),
      buildTaskSection(context.cos_tasks),
      buildIdeaSection(context.cos_ideas),
      buildMaintenanceSection(context.maintenance_tasks),
      buildProviderSection(context.providers),
    ].filter(Boolean).join("\n");

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are a personal Chief of Staff assistant. You have full knowledge of the user's tasks, ideas, assets, maintenance schedules, and service providers. Use this information to give specific, helpful answers.

Today's date is ${today}.
${dataSections}

When answering:
- Reference specific items by name when relevant
- If asked about tasks, distinguish between Kanban tasks (personal/ad-hoc) and maintenance tasks (asset-related)
- For task counts or summaries, give accurate numbers based on the data
- For overdue items, compare due dates against today's date (${today})
- If asked to find something, search across all data types
- Be concise but thorough
- If something isn't in the data, say so`;

    // Build Gemini conversation contents
    const contents: any[] = [];
    if (history?.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }
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
