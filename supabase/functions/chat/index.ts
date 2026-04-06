import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Tool declarations for Gemini function calling ──

const toolDeclarations = [
  {
    name: "create_task",
    description: "Create a new task on the Kanban board (cos_tasks table). Use when the user wants to add a to-do, backlog item, or general task.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Task description (optional)" },
        status: { type: "string", enum: ["backlog", "to-do", "in-progress", "blocked", "done"], description: "Task status, default 'backlog'" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Priority level, default 'low'" },
        due_date: { type: "string", description: "Due date YYYY-MM-DD (optional)" },
        category_id: { type: "string", description: "UUID of the cos_category (optional)" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Update an existing Kanban task (cos_tasks). Identify the task from context data by its ID.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The task's UUID" },
        title: { type: "string" },
        description: { type: "string" },
        status: { type: "string", enum: ["backlog", "to-do", "in-progress", "blocked", "done"] },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        due_date: { type: "string", description: "YYYY-MM-DD or empty string to clear" },
        category_id: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "create_idea",
    description: "Create a new idea (cos_ideas table).",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Idea title" },
        description: { type: "string" },
        status: { type: "string", enum: ["new", "in-progress", "parked", "done"], description: "Default 'new'" },
        category_id: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_idea",
    description: "Update an existing idea (cos_ideas). Identify from context data.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The idea's UUID" },
        title: { type: "string" },
        description: { type: "string" },
        status: { type: "string", enum: ["new", "in-progress", "parked", "done"] },
        category_id: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "create_asset",
    description: "Create a new asset (assets table).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Asset name" },
        category_id: { type: "string" },
        description: { type: "string" },
        purchase_date: { type: "string", description: "YYYY-MM-DD" },
        notes: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_provider",
    description: "Create a new service provider (service_providers table).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Provider name" },
        category_id: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        address: { type: "string" },
        website: { type: "string" },
        notes: { type: "string" },
      },
      required: ["name"],
    },
  },
];

// ── Execute a function call against Supabase ──

async function executeFunctionCall(name: string, args: any, sb: any): Promise<{ success: boolean; record?: any; error?: string }> {
  console.log(`Executing function: ${name}`, JSON.stringify(args));
  try {
    switch (name) {
      case "create_task": {
        const row: any = {
          title: args.title,
          status: args.status || "backlog",
          priority: args.priority || "low",
          category_id: args.category_id || "ecfc9834-8791-4199-9a2b-c4f49df4db9d",
        };
        if (args.description) row.description = args.description;
        if (args.due_date) row.due_date = args.due_date;
        const { data, error } = await sb.from("cos_tasks").insert(row).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, record: data };
      }
      case "update_task": {
        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.status !== undefined) updates.status = args.status;
        if (args.priority !== undefined) updates.priority = args.priority;
        if (args.category_id !== undefined) updates.category_id = args.category_id;
        if (args.due_date !== undefined) updates.due_date = args.due_date === "" ? null : args.due_date;
        const { data, error } = await sb.from("cos_tasks").update(updates).eq("id", args.id).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, record: data };
      }
      case "create_idea": {
        const row: any = {
          title: args.title,
          status: args.status || "new",
          category_id: args.category_id || "ecfc9834-8791-4199-9a2b-c4f49df4db9d",
        };
        if (args.description) row.description = args.description;
        const { data, error } = await sb.from("cos_ideas").insert(row).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, record: data };
      }
      case "update_idea": {
        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.status !== undefined) updates.status = args.status;
        if (args.category_id !== undefined) updates.category_id = args.category_id;
        const { data, error } = await sb.from("cos_ideas").update(updates).eq("id", args.id).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, record: data };
      }
      case "create_asset": {
        const row: any = { name: args.name };
        if (args.category_id) row.category_id = args.category_id;
        if (args.description) row.description = args.description;
        if (args.purchase_date) row.purchase_date = args.purchase_date;
        if (args.notes) row.notes = args.notes;
        const { data, error } = await sb.from("assets").insert(row).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, record: data };
      }
      case "create_provider": {
        const row: any = { name: args.name };
        if (args.category_id) row.category_id = args.category_id;
        if (args.phone) row.phone = args.phone;
        if (args.email) row.email = args.email;
        if (args.address) row.address = args.address;
        if (args.website) row.website = args.website;
        if (args.notes) row.notes = args.notes;
        const { data, error } = await sb.from("service_providers").insert(row).select().single();
        if (error) return { success: false, error: error.message };
        return { success: true, record: data };
      }
      default:
        return { success: false, error: `Unknown function: ${name}` };
    }
  } catch (e) {
    console.error(`Function ${name} threw:`, e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ── Context section builders (now include IDs) ──

function buildAssetSection(assets: any[]): string {
  if (!assets?.length) return "";
  const lines = assets.map((a) => {
    const parts = [`- [${a.id}] ${a.name}`];
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
    const parts = [`- [${t.id}] ${t.title} [Status: ${t.status || "Unknown"}, Priority: ${t.priority || "Medium"}]`];
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
    const parts = [`- [${i.id}] ${i.title} [Status: ${i.status || "New"}]`];
    if (i.description) parts.push(`— ${i.description}`);
    return parts.join(" ");
  });
  return `\nIDEAS:\n${lines.join("\n")}`;
}

function buildMaintenanceSection(events: any[]): string {
  if (!events?.length) return "";
  const lines = events.map((e) => {
    const parts = [`- ${e.name}`];
    if (e.assetName) parts.push(`Asset: ${e.assetName}`);
    if (e.nextDueDate) parts.push(`Due: ${e.nextDueDate}`);
    if (e.frequency) parts.push(`Every ${e.frequency.interval} ${e.frequency.unit}`);
    if (e.status) parts.push(`[${e.status}]`);
    return parts.join(" ");
  });
  return `\nMAINTENANCE EVENTS (scheduled from AI enrichments):\n${lines.join("\n")}`;
}

function buildProviderSection(providers: any[]): string {
  if (!providers?.length) return "";
  const lines = providers.map((p) => {
    const parts = [`- [${p.id}] ${p.name}`];
    if (p.categoryName) parts.push(`(${p.categoryName})`);
    if (p.phone) parts.push(`Phone: ${p.phone}`);
    if (p.email) parts.push(`Email: ${p.email}`);
    return parts.join(" ");
  });
  return `\nSERVICE PROVIDERS:\n${lines.join("\n")}`;
}

function buildCategorySection(categories: any[], label: string): string {
  if (!categories?.length) return "";
  const lines = categories.map((c) => `- [${c.id}] ${c.icon ? c.icon + " " : ""}${c.name}`);
  return `\n${label}:\n${lines.join("\n")}`;
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const message = body.message;
    const history = body.history || [];
    const context = body.context || {};
    const assets = context.assets || body.assets || [];

    console.log("Chat request. Message length:", message?.length, "Context keys:", Object.keys(context));

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build data sections for the system prompt
    const dataSections = [
      buildAssetSection(assets),
      buildTaskSection(context.cos_tasks),
      buildIdeaSection(context.cos_ideas),
      buildMaintenanceSection(context.maintenance_tasks),
      buildProviderSection(context.providers),
      buildCategorySection(context.categories, "ASSET/PROVIDER CATEGORIES (use these IDs when creating assets or providers)"),
      buildCategorySection(context.cos_categories, "TASK/IDEA CATEGORIES (use these IDs when creating tasks or ideas)"),
    ].filter(Boolean).join("\n");

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are a personal Chief of Staff assistant. You have full knowledge of the user's tasks, ideas, assets, maintenance schedules, and service providers. Use this information to give specific, helpful answers.

Today's date is ${today}.
${dataSections}

When answering:
- When listing or mentioning specific items from the context data, wrap each one with [[type:id|Display Name]] syntax — e.g. [[task:abc-123|Fix the roof]], [[idea:def-456|New garden layout]], [[provider:ghi-789|Joe's Plumbing]], [[asset:jkl-012|Water Heater]]. The type must be one of: task, idea, provider, asset. Use the item's actual ID from the data. This enables clickable navigation in the UI.
- NEVER show raw UUIDs or database IDs as visible text in your responses. Only show human-readable information like titles, names, dates, statuses, and priorities. IDs should only appear inside the [[type:id|label]] markers.
- Reference specific items by name when relevant
- If asked about tasks, distinguish between Kanban tasks (personal/ad-hoc) and maintenance events (asset-related scheduled maintenance from AI enrichments)
- For task counts or summaries, give accurate numbers based on the data
- For overdue items, compare due dates against today's date (${today})
- If asked to find something, search across all data types
- Be concise but thorough
- If something isn't in the data, say so

You can also create and update records. When the user asks you to add, create, change, update, mark, or move items, use the appropriate function. Always confirm what you did after making a change.

When creating tasks or ideas without a specified category, default to the Backlog category (ecfc9834-8791-4199-9a2b-c4f49df4db9d).

For updates, identify the correct item from the context data using the IDs provided (shown in square brackets). If you're unsure which item the user means, ask for clarification before making changes.`;

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

    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const geminiPayload: any = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      tools: [{ function_declarations: toolDeclarations }],
    };

    console.log("Calling Gemini API (with tools)...");
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const firstCandidate = geminiData?.candidates?.[0];
    const parts = firstCandidate?.content?.parts || [];

    // Check if Gemini wants to call a function
    const functionCallPart = parts.find((p: any) => p.functionCall);

    if (functionCallPart) {
      const { name, args } = functionCallPart.functionCall;
      console.log(`Gemini requested function call: ${name}`, JSON.stringify(args));

      // Execute the database operation
      const result = await executeFunctionCall(name, args, sb);
      console.log(`Function result:`, JSON.stringify(result));

      // Send the result back to Gemini for a natural language confirmation
      const followUpContents = [
        ...contents,
        { role: "model", parts: [{ functionCall: { name, args } }] },
        { role: "user", parts: [{ functionResponse: { name, response: result } }] },
      ];

      const followUpRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: followUpContents,
          tools: [{ function_declarations: toolDeclarations }],
        }),
      });

      if (!followUpRes.ok) {
        const errText = await followUpRes.text();
        console.error("Gemini follow-up error:", followUpRes.status, errText);
        // Still return something useful
        const fallback = result.success
          ? `Done! I ${name.startsWith("create") ? "created" : "updated"} the record successfully.`
          : `Sorry, there was an error: ${result.error}`;
        return new Response(JSON.stringify({ reply: fallback, mutated: result.success }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const followUpData = await followUpRes.json();
      const reply = followUpData?.candidates?.[0]?.content?.parts?.[0]?.text
        ?? (result.success ? "Done!" : `Error: ${result.error}`);

      console.log("Function call complete. Mutated:", result.success);
      return new Response(JSON.stringify({ reply, mutated: result.success }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No function call — return text response as usual
    const reply = parts.find((p: any) => p.text)?.text ?? "Sorry, I couldn't generate a response.";
    console.log("Gemini reply length:", reply.length);

    return new Response(JSON.stringify({ reply, mutated: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
