import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function advanceDate(dateStr: string, freq: { interval: number; unit: string }): string {
  const d = new Date(dateStr + "T00:00:00Z");
  switch (freq.unit) {
    case "days":
      d.setUTCDate(d.getUTCDate() + freq.interval);
      break;
    case "weeks":
      d.setUTCDate(d.getUTCDate() + freq.interval * 7);
      break;
    case "months":
      d.setUTCMonth(d.getUTCMonth() + freq.interval);
      break;
    case "years":
      d.setUTCFullYear(d.getUTCFullYear() + freq.interval);
      break;
    default:
      d.setUTCMonth(d.getUTCMonth() + freq.interval);
  }
  return d.toISOString().slice(0, 10);
}

interface DigestItem {
  title: string;
  type: "task" | "maintenance";
  assetName?: string;
  dueDate: string;
  urgency: "overdue" | "upcoming";
  daysOffset: number;
}

async function gatherItems(supabase: any): Promise<DigestItem[]> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const sevenOut = new Date(today);
  sevenOut.setDate(sevenOut.getDate() + 7);
  const sevenStr = sevenOut.toISOString().slice(0, 10);
  const items: DigestItem[] = [];

  // cos_tasks with due dates
  const { data: tasks } = await supabase
    .from("cos_tasks")
    .select("id, title, due_date, status")
    .not("due_date", "is", null)
    .neq("status", "done")
    .lte("due_date", sevenStr);

  for (const t of tasks ?? []) {
    const due = t.due_date;
    const diff = Math.round(
      (new Date(due).getTime() - today.getTime()) / 86400000
    );
    items.push({
      title: t.title,
      type: "task",
      dueDate: due,
      urgency: due < todayStr ? "overdue" : "upcoming",
      daysOffset: diff,
    });
  }

  // Maintenance from ai_enrichments
  const { data: enrichments } = await supabase
    .from("ai_enrichments")
    .select("*")
    .eq("item_type", "asset");

  const { data: completions } = await supabase
    .from("tasks")
    .select("name, asset_id, date_completed")
    .eq("status", "completed")
    .not("date_completed", "is", null)
    .order("date_completed", { ascending: false });

  const completionMap = new Map<string, string>();
  for (const c of completions ?? []) {
    const key = `${c.name}|${c.asset_id}`;
    if (!completionMap.has(key)) completionMap.set(key, c.date_completed);
  }

  for (const enrichment of enrichments ?? []) {
    const suggestions = Array.isArray(enrichment.suggestions)
      ? enrichment.suggestions
      : [];
    for (const s of suggestions) {
      if (s.status !== "scheduled") continue;

      const freq =
        typeof s.frequency === "object" && s.frequency ? s.frequency : null;
      const completionKey = `${s.suggestion}|${enrichment.item_id}`;
      const lastCompleted = completionMap.get(completionKey) || null;

      let nextDueDate = s.recommended_due_date || null;
      if (lastCompleted && freq) {
        let candidate = advanceDate(lastCompleted, freq);
        let safety = 0;
        while (candidate < todayStr && safety < 100) {
          candidate = advanceDate(candidate, freq);
          safety++;
        }
        nextDueDate = candidate;
      } else if (nextDueDate && freq && nextDueDate < todayStr) {
        let candidate = nextDueDate;
        let safety = 0;
        while (candidate < todayStr && safety < 100) {
          candidate = advanceDate(candidate, freq);
          safety++;
        }
        nextDueDate = candidate;
      }

      if (!nextDueDate) continue;

      // Skip if completed within current period
      if (lastCompleted && freq) {
        const nextAfter = advanceDate(lastCompleted, freq);
        if (nextAfter > todayStr) continue;
      }

      const isOverdue = nextDueDate < todayStr;
      const isUpcoming = nextDueDate >= todayStr && nextDueDate <= sevenStr;
      if (!isOverdue && !isUpcoming) continue;

      const diff = Math.round(
        (new Date(nextDueDate).getTime() - today.getTime()) / 86400000
      );
      items.push({
        title: s.suggestion,
        type: "maintenance",
        assetName: enrichment.item_title,
        dueDate: nextDueDate,
        urgency: isOverdue ? "overdue" : "upcoming",
        daysOffset: diff,
      });
    }
  }

  items.sort((a, b) => a.daysOffset - b.daysOffset);
  return items;
}

function buildEmailHtml(items: DigestItem[], appUrl: string): string {
  const overdue = items.filter((i) => i.urgency === "overdue");
  const upcoming = items.filter((i) => i.urgency === "upcoming");

  let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">`;
  html += `<h2 style="color: #1a1a1a; margin-bottom: 24px;">CoS Daily Digest</h2>`;

  if (items.length === 0) {
    html += `<p style="color: #6b7280;">Nothing needs attention right now.</p>`;
  }

  if (overdue.length > 0) {
    html += `<h3 style="color: #dc2626; margin-top: 20px;">Overdue (${overdue.length})</h3>`;
    html += `<table style="width:100%; border-collapse:collapse;">`;
    for (const item of overdue) {
      const days = Math.abs(item.daysOffset);
      const label = `${days} day${days !== 1 ? "s" : ""} overdue`;
      const typeLabel = item.type === "task" ? "Task" : "Maintenance";
      const subtitle = item.assetName ? ` &middot; ${item.assetName}` : "";
      html += `<tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0;">
          <strong>${item.title}</strong>
          <span style="color:#6b7280; font-size:13px;">${subtitle}</span>
          <br/><span style="color:#9ca3af; font-size:12px;">${typeLabel}</span>
        </td>
        <td style="padding: 10px 0; text-align:right; color:#dc2626; white-space:nowrap; font-size:13px;">${label}</td>
      </tr>`;
    }
    html += `</table>`;
  }

  if (upcoming.length > 0) {
    html += `<h3 style="color: #d97706; margin-top: 20px;">Upcoming (${upcoming.length})</h3>`;
    html += `<table style="width:100%; border-collapse:collapse;">`;
    for (const item of upcoming) {
      const label =
        item.daysOffset === 0
          ? "Due today"
          : `${item.daysOffset} day${item.daysOffset !== 1 ? "s" : ""}`;
      const typeLabel = item.type === "task" ? "Task" : "Maintenance";
      const subtitle = item.assetName ? ` &middot; ${item.assetName}` : "";
      html += `<tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0;">
          <strong>${item.title}</strong>
          <span style="color:#6b7280; font-size:13px;">${subtitle}</span>
          <br/><span style="color:#9ca3af; font-size:12px;">${typeLabel}</span>
        </td>
        <td style="padding: 10px 0; text-align:right; color:#d97706; white-space:nowrap; font-size:13px;">${label}</td>
      </tr>`;
    }
    html += `</table>`;
  }

  html += `<p style="margin-top: 32px;"><a href="${appUrl}" style="color: #2563eb; text-decoration: none;">Open CoS Dashboard &rarr;</a></p>`;
  html += `</div>`;
  return html;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const items = await gatherItems(supabase);

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ sent: false, reason: "No items need attention" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not set");

    const recipientEmail = Deno.env.get("DIGEST_RECIPIENT_EMAIL");
    if (!recipientEmail) throw new Error("DIGEST_RECIPIENT_EMAIL not set");

    const appUrl = Deno.env.get("APP_URL") || "https://your-app.lovable.app";

    const subject = `CoS Daily Digest — ${items.length} item${items.length !== 1 ? "s" : ""} need attention`;
    const html = buildEmailHtml(items, appUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CoS Digest <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error ${res.status}: ${err}`);
    }

    const result = await res.json();

    return new Response(
      JSON.stringify({ sent: true, itemCount: items.length, resendId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-daily-digest error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
