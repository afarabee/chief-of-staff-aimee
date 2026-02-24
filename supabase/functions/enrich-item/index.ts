import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseGeminiJsonResponse(text: string): Array<Record<string, any>> {
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

function buildAssetPrompt(item: Record<string, any>): string {
  const name = item.title || item.name || "Untitled";
  const category = item.category || "None";
  const description = item.description || "None";
  const notes = item.notes || "None";
  const purchaseDate = item.purchase_date || "Unknown";
  const providers = item.linked_providers || "None";
  const existingTasks = item.existing_tasks || "None";
  const today = new Date().toISOString().split("T")[0];

  return `You are a home and property maintenance expert. Given an asset, suggest specific maintenance tasks with recommended frequencies and due dates. Only suggest things that have a recurring schedule or a deadline. Do NOT suggest general advice or tips. Each suggestion must be a specific actionable maintenance event.

Asset name: ${name}
Category: ${category}
Description: ${description}
Notes: ${notes}
Purchase date: ${purchaseDate}
Linked service providers: ${providers}
Existing maintenance tasks: ${existingTasks}

Format each suggestion as a JSON object with:
- "suggestion": what to do (specific maintenance action, or a group title if bundling multiple tasks)
- "frequency": a JSON object with "interval" (number) and "unit" (one of: "days", "weeks", "months", "years"). For example: {"interval": 3, "unit": "years"} for every 3 years, {"interval": 6, "unit": "months"} for every 6 months, {"interval": 1, "unit": "years"} for annually.
- "recommended_due_date": next due date in YYYY-MM-DD format, starting from today's date which is ${today}
- "bundled_items": (optional) an array of strings listing individual tasks. Use this when multiple related tasks share the same frequency and due date. The "suggestion" field becomes the group title.

IMPORTANT: If multiple tasks share the same frequency AND the same recommended due date, you MUST bundle them into a single suggestion. Give the bundle a descriptive group title (e.g., "Spring HVAC maintenance", "Annual water heater service") and list the individual tasks in "bundled_items". Only keep tasks as separate suggestions if they have different frequencies or different due dates.

Return 3-7 suggestions depending on the asset type. Return ONLY a JSON array, no other text.

Example:
[
  { "suggestion": "Annual septic system service", "frequency": {"interval": 1, "unit": "years"}, "recommended_due_date": "2026-09-01", "bundled_items": ["Inspect septic tank baffles", "Check drain field for wet spots", "Measure sludge and scum levels"] },
  { "suggestion": "Pump septic tank", "frequency": {"interval": 3, "unit": "years"}, "recommended_due_date": "2026-06-01" }
]`;
}

function buildDefaultPrompt(item_type: string, item: Record<string, any>): string {
  const title = item.title || item.name || "Untitled";
  const description = item.description || item.notes || "None";
  const status = item.status || "None";
  const priority = item.priority || "None";
  const dueDate = item.due_date || item.next_due_date || "None";
  const recurrence = item.recurrence_rule || "None";

  return `You are a personal AI assistant helping someone manage their life. You've been given a single item from their task/idea/reminder list. Your job is to suggest 3-5 specific, actionable things that an AI assistant (like Claude) could do RIGHT NOW to help them complete or advance this item.

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
}

/**
 * Groups all suggestions that share the same frequency + due date into a single bundle.
 * Handles both unbundled items AND already-bundled items (merges them together).
 */
function autoBundleSuggestions(suggestions: Array<Record<string, any>>): Array<Record<string, any>> {
  const groups = new Map<string, string[]>();
  const groupMeta = new Map<string, { frequency: any; recommended_due_date: string }>();
  const noKey: Array<Record<string, any>> = [];

  for (const s of suggestions) {
    const freq = s.frequency;
    const date = s.recommended_due_date;
    if (!freq || !date) {
      noKey.push(s);
      continue;
    }

    const key = `${freq.interval}|${freq.unit}|${date}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      groupMeta.set(key, { frequency: freq, recommended_due_date: date });
    }

    // Flatten: if this item has bundled_items, add those; otherwise add the suggestion itself
    if (Array.isArray(s.bundled_items) && s.bundled_items.length > 0) {
      groups.get(key)!.push(...s.bundled_items);
    } else {
      groups.get(key)!.push(s.suggestion);
    }
  }

  const result: Array<Record<string, any>> = [...noKey];

  for (const [key, items] of groups) {
    const meta = groupMeta.get(key)!;
    if (items.length === 1) {
      // Single task — no bundle needed
      result.push({
        suggestion: items[0],
        frequency: meta.frequency,
        recommended_due_date: meta.recommended_due_date,
      });
    } else {
      // Multiple tasks — create a bundle
      const unit = meta.frequency.unit as string;
      const interval = meta.frequency.interval as number;

      let title: string;
      if (interval === 1 && unit === "years") title = "Annual maintenance";
      else if (interval === 6 && unit === "months") title = "Semi-annual maintenance";
      else if (interval === 3 && unit === "months") title = "Quarterly maintenance";
      else if (interval === 1 && unit === "months") title = "Monthly maintenance";
      else title = `Every ${interval} ${unit} maintenance`;

      result.push({
        suggestion: title,
        frequency: meta.frequency,
        recommended_due_date: meta.recommended_due_date,
        bundled_items: items,
      });
    }
  }

  return result;
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

    const prompt = item_type === "asset"
      ? buildAssetPrompt(item)
      : buildDefaultPrompt(item_type, item);

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

    // Post-process: auto-bundle suggestions that share the same frequency + due date
    const bundled = autoBundleSuggestions(suggestionsArray);
    const suggestionsJson = JSON.stringify(bundled);

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
