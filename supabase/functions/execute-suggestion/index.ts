import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { suggestion, item_type, item_title, item_description, item_id, suggestion_index } = await req.json();

    if (!suggestion || !item_type || !item_id || suggestion_index === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
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

    const context = item_description || "No additional context";
    const prompt = `You are a helpful personal assistant. The user has a ${item_type} titled "${item_title}" with this context: "${context}".

They want you to execute the following suggestion:
"${suggestion}"

Do this task thoroughly and provide a complete, useful result. Format your response clearly with headers, bullet points, or tables as appropriate. Be specific and actionable — provide real information, not placeholder text.`;

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
      return new Response(JSON.stringify({ error: "Failed to execute suggestion" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const result = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!result) {
      return new Response(JSON.stringify({ error: "No result generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the ai_suggestions JSON in the database
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

    // Read current suggestions
    const { data: row, error: readErr } = await sb
      .from(table)
      .select("ai_suggestions")
      .eq("id", item_id)
      .single();

    if (readErr) {
      console.error("DB read error:", readErr);
    } else if (row?.ai_suggestions) {
      try {
        const suggestions = JSON.parse(row.ai_suggestions);
        if (Array.isArray(suggestions) && suggestions[suggestion_index]) {
          suggestions[suggestion_index].result = result;
          await sb
            .from(table)
            .update({ ai_suggestions: JSON.stringify(suggestions) })
            .eq("id", item_id);
        }
      } catch (e) {
        console.error("Failed to update suggestions JSON:", e);
      }
    }

    // Log execution to ai_executions
    const { error: insertErr } = await sb.from("ai_executions").insert({
      item_type,
      item_id,
      item_title: item_title || "Untitled",
      suggestion,
      result,
    });
    if (insertErr) {
      console.error("Failed to log ai_execution:", insertErr);
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("execute-suggestion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
