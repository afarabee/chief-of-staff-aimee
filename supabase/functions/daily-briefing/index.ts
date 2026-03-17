import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch tasks
    const { data: tasks } = await sb.from("cos_tasks").select("id, title, status, priority, due_date, description");
    // Fetch ideas
    const { data: ideas } = await sb.from("cos_ideas").select("id, title, status, description, created_at");
    // Fetch maintenance enrichments
    const { data: enrichments } = await sb.from("ai_enrichments").select("item_title, suggestions, item_type").eq("item_type", "asset");

    const today = new Date().toISOString().slice(0, 10);
    const normalizeStatus = (status: unknown) => (typeof status === "string" ? status.trim().toLowerCase() : "");

    const activeTasks = (tasks || []).filter((t: any) => normalizeStatus(t.status) !== "done");
    const activeIdeas = (ideas || []).filter((i: any) => normalizeStatus(i.status) !== "done");

    const overdueTasks = activeTasks.filter((t: any) => t.due_date && t.due_date < today);
    const todayTasks = activeTasks.filter((t: any) => t.due_date === today);
    const upcomingTasks = activeTasks.filter((t: any) => t.due_date && t.due_date > today).slice(0, 5);
    const blockedTasks = activeTasks.filter((t: any) => normalizeStatus(t.status) === "blocked");
    const parkedIdeas = activeIdeas.filter((i: any) => {
      const status = normalizeStatus(i.status);
      return status === "parked" || status === "new";
    });

    // Build context for AI — include IDs so the model can reference them
    const context = `
TODAY: ${today}

OVERDUE TASKS (${overdueTasks.length}):
${overdueTasks.map((t: any) => `- [id:${t.id}] "${t.title}" (due ${t.due_date}, priority: ${t.priority})`).join("\n") || "None"}

DUE TODAY (${todayTasks.length}):
${todayTasks.map((t: any) => `- [id:${t.id}] "${t.title}" (priority: ${t.priority})`).join("\n") || "None"}

UPCOMING TASKS (next 5):
${upcomingTasks.map((t: any) => `- [id:${t.id}] "${t.title}" (due ${t.due_date})`).join("\n") || "None"}

BLOCKED TASKS (${blockedTasks.length}):
${blockedTasks.map((t: any) => `- [id:${t.id}] "${t.title}": ${(t.description || "").slice(0, 80)}`).join("\n") || "None"}

IDEAS (${parkedIdeas.length} parked/new):
${parkedIdeas.slice(0, 8).map((i: any) => `- [id:${i.id}] "${i.title}" (status: ${i.status}, created: ${i.created_at?.slice(0, 10)}): ${(i.description || "").slice(0, 80)}`).join("\n") || "None"}

TOTAL OPEN TASKS: ${activeTasks.length}
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI Chief of Staff assistant. Generate a daily briefing based on the user's tasks, ideas, and schedule. Be warm, concise, and actionable. Never show IDs in the text fields. Each item in the data has an [id:UUID] prefix — use those UUIDs in related_item_ids when a suggestion refers to specific tasks or ideas.`,
          },
          {
            role: "user",
            content: `Generate my daily briefing. Here's my current state:\n${context}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "daily_briefing",
              description: "Return a structured daily briefing",
              parameters: {
                type: "object",
                properties: {
                  greeting: { type: "string", description: "A warm, personalized one-line greeting for the day" },
                  summary: { type: "string", description: "2-3 sentence overview of the day: what's overdue, what's due, what needs attention" },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The actionable suggestion" },
                        type: { type: "string", enum: ["reschedule", "focus", "unblock", "idea", "general"] },
                        related_item_ids: {
                          type: "array",
                          items: { type: "string" },
                          description: "UUIDs of the specific tasks or ideas this suggestion refers to. Only include when the suggestion maps to specific items from the data. Omit or leave empty for general suggestions.",
                        },
                      },
                      required: ["text", "type"],
                    },
                    description: "2-4 actionable AI suggestions for the day",
                  },
                  ideaSpotlight: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      reason: { type: "string", description: "Why this idea was picked (e.g. been parked for 2 weeks)" },
                      steps: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-3 concrete next steps to move this idea forward",
                      },
                    },
                    required: ["title", "reason", "steps"],
                    description: "Pick one parked/new idea and suggest how to act on it. If no ideas exist, pick a general productivity tip.",
                  },
                },
                required: ["greeting", "summary", "suggestions", "ideaSpotlight"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "daily_briefing" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let briefing;
    if (toolCall?.function?.arguments) {
      briefing = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback
      briefing = {
        greeting: "Good morning! Here's your daily briefing.",
        summary: `You have ${overdueTasks.length} overdue tasks, ${todayTasks.length} due today, and ${(tasks || []).length} total open tasks.`,
        suggestions: [{ text: "Review your overdue tasks and reschedule or complete them.", type: "reschedule" }],
        ideaSpotlight: parkedIdeas.length > 0
          ? { title: parkedIdeas[0].title, reason: "This idea has been waiting for attention.", steps: ["Break it into smaller tasks", "Set a deadline"] }
          : { title: "No ideas yet", reason: "Start capturing ideas!", steps: ["Use the quick capture bar", "Browse for inspiration"] },
      };
    }

    return new Response(JSON.stringify(briefing), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
