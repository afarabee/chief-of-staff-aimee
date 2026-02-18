import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseGeminiJsonResponse(text: string): Array<{ suggestion: string }> {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].suggestion) {
      return parsed;
    }
  } catch {
    // Fall back to splitting numbered lines
  }

  // Fallback: split by numbered lines
  const lines = text.split(/\n/).filter((l) => l.trim());
  const suggestions: Array<{ suggestion: string }> = [];
  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+)/);
    if (match) {
      suggestions.push({ suggestion: match[1].trim() });
    }
  }
  return suggestions.length > 0 ? suggestions : [{ suggestion: text.trim() }];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { item_type, item } = await req.json();

    if (!item_type || !item || !item.id) {
      return new Response(JSON.stringify({ error: "Missing item_type or item" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY =
      Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = item.title || item.name || "Untitled";
    const description = item.description || item.notes || "None";
    const status = item.status || "None";
    const priority = item.priority || "None";
    const dueDate = item.due_date || item.next_due_date || "None";
    const recurrence = item.recurrence_rule || "None";

    const prompt = `You are a personal AI assistant helping someone manage their life. You've been given a single item from their task/idea/reminder list. Your job is to suggest 3-5 specific, actionable things that an AI assistant (like Claude) could do RIGHT NOW to help them complete or advance this item.

Item type: ${item_type}
Title: ${title}
Description: ${description}
Status: ${status}
Priority: ${priority}
Due date: ${dueDate}
Recurrence: ${recurrence}

Each suggestion should:
- Start with a clear action verb (Draft, Research, Create, Compare, Summarize, Find, Write, Build, Outline, Calculate, etc.)
- Be specific to THIS item, not generic advice
- Describe something an AI can actually do (not physical tasks)
- Be 1-2 sentences max

Do NOT include:
- Generic suggestions like "Set a reminder" or "Break this into subtasks" (they already have a task system)
- Physical actions the AI can't do
- Suggestions to use other apps or tools

Respond ONLY with a JSON array of objects. Each object has a single "suggestion" field containing the suggestion text. Example:
[
  { "suggestion": "Draft a comparison table of the top 3 pet insurance providers with monthly costs, coverage limits, and exclusions." },
  { "suggestion": "Write a cancellation email template for the n8n subscription, including a request for confirmation." }
]`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to get AI suggestions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return new Response(JSON.stringify({ error: "No suggestions generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestionsArray = parseGeminiJsonResponse(rawText);
    const suggestionsJson = JSON.stringify(suggestionsArray);

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let table: string;
    if (item_type === "task") table = "cos_tasks";
    else if (item_type === "idea") table = "cos_ideas";
    else if (item_type === "reminder") table = "tasks";
    else {
      return new Response(JSON.stringify({ error: "Invalid item_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await sb
      .from(table)
      .update({ ai_suggestions: suggestionsJson })
      .eq("id", item.id);

    if (updateErr) {
      console.error("DB update error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to save suggestions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions: suggestionsJson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enrich-item error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
