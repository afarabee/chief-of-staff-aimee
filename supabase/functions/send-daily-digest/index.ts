import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Data fetching helpers ---

async function fetchOverdueTasks(supabase: any) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("cos_tasks")
    .select("id, title, due_date, priority, status")
    .not("due_date", "is", null)
    .neq("status", "done")
    .lt("due_date", today)
    .order("due_date", { ascending: true });
  return data ?? [];
}

async function fetchTodayTasks(supabase: any) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("cos_tasks")
    .select("id, title, priority, status")
    .neq("status", "done")
    .eq("due_date", today)
    .order("priority", { ascending: false });
  return data ?? [];
}

async function fetchUpcomingTasks(supabase: any) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("cos_tasks")
    .select("id, title, due_date, priority")
    .neq("status", "done")
    .gt("due_date", today)
    .order("due_date", { ascending: true })
    .limit(3);
  return data ?? [];
}

async function fetchIdeasInProgress(supabase: any) {
  const { data } = await supabase
    .from("cos_ideas")
    .select("id, title, description")
    .eq("status", "in-progress")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

async function fetchUpcomingMaintenance(supabase: any) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("tasks")
    .select("id, name, next_due_date, status, notes")
    .eq("status", "pending")
    .gte("next_due_date", today)
    .order("next_due_date", { ascending: true })
    .limit(3);
  return data ?? [];
}

async function fetchHandoffSummaries(supabase: any) {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const cutoff = threeDaysAgo.toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("handoff_summaries")
      .select("session_date, project_name, tools, completed, in_progress, next_steps, resume_command")
      .gte("session_date", cutoff)
      .order("session_date", { ascending: false });
    if (error) {
      console.error("fetchHandoffSummaries error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error("fetchHandoffSummaries exception:", e);
    return [];
  }
}

async function callEdgeFunction(
  supabaseUrl: string,
  serviceRoleKey: string,
  functionName: string,
  body?: object
): Promise<any> {
  try {
    const url = `${supabaseUrl}/functions/v1/${functionName}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      console.error(`${functionName} call failed: ${res.status}`);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error(`${functionName} call error:`, e);
    return null;
  }
}

// --- Date helpers ---

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatEventTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch {
    return "";
  }
}

function daysOverdue(dateStr: string): number {
  const today = new Date();
  const due = new Date(dateStr + "T00:00:00");
  return Math.round((today.getTime() - due.getTime()) / 86400000);
}

function priorityDot(priority: string | null): string {
  if (!priority) return "";
  switch (priority.toLowerCase()) {
    case "high": return `<span style="color:#dc2626;">&#x1F534;</span>`;
    case "medium": return `<span style="color:#d97706;">&#x1F7E1;</span>`;
    case "low": return `<span style="color:#16a34a;">&#x1F7E2;</span>`;
    default: return "";
  }
}

// --- HTML builder ---

function buildBriefingHtml(data: {
  briefing: any;
  overdueTasks: any[];
  todayTasks: any[];
  upcomingTasks: any[];
  ideasInProgress: any[];
  upcomingMaintenance: any[];
  handoffSummaries: any[];
  calendarData: any;
  newsData: any;
  appUrl: string;
}): string {
  const {
    briefing, overdueTasks, todayTasks, upcomingTasks,
    ideasInProgress, upcomingMaintenance, handoffSummaries, calendarData, newsData, appUrl,
  } = data;

  const now = new Date();
  const dayName = DAYS[now.getDay()];
  const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const section = (emoji: string, title: string, content: string) => `
    <div style="background:#f9fafb; border-radius:8px; padding:16px; margin-bottom:16px;">
      <h3 style="margin:0 0 10px 0; color:#1a1a1a; font-size:16px;">${emoji} ${title}</h3>
      ${content}
    </div>`;

  const bullet = (text: string) => `<div style="padding:3px 0; color:#374151; font-size:14px;">• ${text}</div>`;
  const link = (label: string, href: string) => `<a href="${href}" style="color:#1d4ed8; text-decoration:underline;">${label}</a>`;

  let html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; max-width:600px; margin:0 auto; padding:20px; background:#ffffff;">`;

  // Greeting
  const greeting = briefing?.greeting || `Good morning! Happy ${dayName}.`;
  html += `<h2 style="color:#1a1a1a; margin-bottom:4px;">&#x2600;&#xFE0F; ${greeting}</h2>`;
  html += `<p style="color:#6b7280; margin-top:0; font-size:14px;">${dayName}, ${dateStr}</p>`;

  // Focus on first
  if (briefing?.suggestions?.length > 0) {
    let focusContent = "";
    const icons = ["&#x1F525;", "&#x1F4B0;", "&#x270D;&#xFE0F;", "&#x1F3AF;"];
    briefing.suggestions.slice(0, 3).forEach((s: any, i: number) => {
      const ids: string[] | undefined = s.relatedItemIds || s.related_item_ids;
      const icon = icons[i] || "&#x27A1;&#xFE0F;";
      const label = ids && ids.length > 0
        ? `${icon} ${link(`<strong>${s.text}</strong>`, `${appUrl}/briefing-items?ids=${ids.join(",")}`)}`
        : `${icon} <strong>${s.text}</strong>`;
      focusContent += bullet(label);
    });
    html += section("&#x1F3AF;", "Here's what to focus on first", focusContent);
  } else if (briefing?.summary) {
    html += section("&#x1F3AF;", "Here's what to focus on first", `<p style="color:#374151; font-size:14px;">${briefing.summary}</p>`);
  }

  // Overdue
  if (overdueTasks.length > 0) {
    let content = "";
    for (const t of overdueTasks) {
      const days = daysOverdue(t.due_date);
      content += bullet(`${link(`<strong>${t.title}</strong>`, `${appUrl}/tasks?edit=${t.id}`)} — ${days} day${days !== 1 ? "s" : ""} overdue ${priorityDot(t.priority)}`);
    }
    html += section("&#x1F6A8;", `Overdue (${overdueTasks.length})`, content);
  } else {
    html += section("&#x1F6A8;", "Overdue", `<p style="color:#16a34a; font-size:14px;">&#x2705; All caught up — nothing overdue.</p>`);
  }

  // Due Today
  if (todayTasks.length > 0) {
    let content = "";
    for (const t of todayTasks) {
      content += bullet(`${link(`<strong>${t.title}</strong>`, `${appUrl}/tasks?edit=${t.id}`)} ${priorityDot(t.priority)}`);
    }
    html += section("&#x1F4CC;", `Due Today (${todayTasks.length})`, content);
  } else {
    html += section("&#x1F4CC;", "Due Today", `<p style="color:#6b7280; font-size:14px;">&#x2728; Clear slate today.</p>`);
  }

  // Coming Up
  if (upcomingTasks.length > 0) {
    let content = "";
    for (const t of upcomingTasks) {
      content += bullet(`${link(`<strong>${t.title}</strong>`, `${appUrl}/tasks?edit=${t.id}`)} — ${formatDate(t.due_date)} ${priorityDot(t.priority)}`);
    }
    html += section("&#x1F4C5;", "Coming Up (Next 3)", content);
  } else {
    html += section("&#x1F4C5;", "Coming Up", `<p style="color:#6b7280; font-size:14px;">Nothing on the horizon.</p>`);
  }

  // Ideas In Progress
  if (ideasInProgress.length > 0) {
    let content = "";
    for (const idea of ideasInProgress) {
      const desc = idea.description ? ` — ${idea.description.slice(0, 80)}` : "";
      content += bullet(`${link(`<strong>${idea.title}</strong>`, `${appUrl}/ideas?edit=${idea.id}`)}${desc}`);
    }
    html += section("&#x1F4A1;", "Ideas In Progress", content);
  } else {
    html += section("&#x1F4A1;", "Ideas In Progress", `<p style="color:#6b7280; font-size:14px;">No active ideas right now.</p>`);
  }

  // Maintenance
  if (upcomingMaintenance.length > 0) {
    let content = "";
    for (const m of upcomingMaintenance) {
      const note = m.notes ? ` &#x26A1; ${m.notes}` : "";
      content += bullet(`${link(`<strong>${m.name}</strong>`, `${appUrl}/maintenance`)} — due ${formatDate(m.next_due_date)}${note}`);
    }
    html += section("&#x1F527;", "Maintenance Check", content);
  } else {
    html += section("&#x1F527;", "Maintenance Check", `<p style="color:#6b7280; font-size:14px;">No upcoming maintenance.</p>`);
  }

  // Calendar (3-day)
  const events = calendarData?.events ?? [];
  const today = new Date();
  const calDays: { label: string; events: any[] }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().slice(0, 10);
    const label = i === 0 ? `Today (${DAYS[d.getDay()]})` : i === 1 ? `Tomorrow (${DAYS[d.getDay()]})` : DAYS[d.getDay()];
    const dayEvents = events.filter((e: any) => {
      const startStr = e.start || "";
      // Timed events: "2026-04-09T14:00:00-05:00" → parse to get UTC date
      // All-day events: "2026-04-09" → slice directly
      const eDate = startStr.length > 10
        ? new Date(startStr).toISOString().slice(0, 10)
        : startStr.slice(0, 10);
      return eDate === dStr;
    });
    calDays.push({ label, events: dayEvents });
  }
  let calContent = "";
  for (const day of calDays) {
    calContent += `<div style="margin-bottom:8px;"><strong>${day.label}:</strong><br/>`;
    if (day.events.length === 0) {
      calContent += `<span style="color:#6b7280; font-size:14px;">&#x1F389; Nothing scheduled</span>`;
    } else {
      for (const e of day.events) {
        const time = e.allDay ? "(all day)" : formatEventTime(e.start);
        calContent += `<span style="color:#374151; font-size:14px;">• ${e.summary} ${time}</span><br/>`;
      }
    }
    calContent += `</div>`;
  }
  html += section("&#x1F5D3;&#xFE0F;", "Calendar (3-Day Look)", calContent);

  // Handoff Scanner
  if (handoffSummaries.length === 0) {
    html += section("&#x1F504;", "Handoff Scanner", `<p style="color:#9ca3af; font-size:14px;">No recent handoff notes.</p>`);
  } else {
    let handoffContent = "";
    for (const h of handoffSummaries) {
      handoffContent += `<div style="margin-bottom:12px;">`;
      handoffContent += `<strong style="color:#1a1a1a; font-size:14px;">${h.project_name}</strong>`;
      if (h.tools?.length > 0) {
        handoffContent += `<div style="color:#6b7280; font-size:12px; margin-top:2px;">Tools: ${h.tools.join(", ")}</div>`;
      }
      if (h.completed?.length > 0) {
        handoffContent += `<div style="color:#6b7280; font-size:12px; margin-top:4px;">Completed:</div>`;
        for (const item of h.completed) {
          handoffContent += `<div style="color:#374151; font-size:13px; padding:1px 0;">• ${item}</div>`;
        }
      }
      if (h.next_steps?.length > 0) {
        handoffContent += `<div style="color:#6b7280; font-size:12px; margin-top:4px;">Pick up here:</div>`;
        for (const step of h.next_steps) {
          handoffContent += `<div style="color:#374151; font-size:13px; padding:1px 0;">&#x27A1;&#xFE0F; ${step}</div>`;
        }
      }
      if (h.resume_command) {
        handoffContent += `<div style="color:#2563eb; font-size:12px; margin-top:4px; font-family:monospace;">${h.resume_command}</div>`;
      }
      handoffContent += `</div>`;
    }
    html += section("&#x1F504;", "Handoff Scanner", handoffContent);
  }

  // Flagged Gmail (placeholder)
  html += section("&#x1F4E7;", "Flagged Emails", `<p style="color:#9ca3af; font-size:14px;">Coming soon — flagged Gmail summary will appear here.</p>`);

  // AI News
  const articles = newsData?.articles ?? [];
  if (articles.length > 0) {
    let content = "";
    for (const a of articles) {
      const link = a.url ? `<a href="${a.url}" style="color:#2563eb; text-decoration:none;">${a.title}</a>` : a.title;
      content += bullet(`${link} — <span style="color:#6b7280;">${a.source}</span>`);
    }
    html += section("&#x1F4F0;", "AI News", content);
  } else {
    html += section("&#x1F4F0;", "AI News", `<p style="color:#6b7280; font-size:14px;">&#x1F937; Quiet day in AI land.</p>`);
  }

  // Idea Spotlight (from daily-briefing)
  if (briefing?.ideaSpotlight) {
    const spot = briefing.ideaSpotlight;
    let content = `<p style="color:#374151; font-size:14px;"><strong>${spot.title}</strong></p>`;
    if (spot.reason) content += `<p style="color:#6b7280; font-size:13px;">${spot.reason}</p>`;
    if (spot.steps?.length > 0) {
      content += `<p style="color:#6b7280; font-size:13px; margin-top:4px;">Next steps:</p>`;
      for (const step of spot.steps) {
        content += `<div style="color:#374151; font-size:13px; padding:2px 0;">• ${step}</div>`;
      }
    }
    html += section("&#x2728;", "Idea Spotlight", content);
  }

  // Footer
  html += `<div style="margin-top:24px; padding-top:16px; border-top:1px solid #e5e7eb;">
    <a href="${appUrl}" style="color:#2563eb; text-decoration:none; font-size:14px;">Open CoS Dashboard &rarr;</a>
  </div>`;
  html += `</div>`;
  return html;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not set");
    const recipientEmail = Deno.env.get("DIGEST_RECIPIENT_EMAIL");
    if (!recipientEmail) throw new Error("DIGEST_RECIPIENT_EMAIL not set");
    const appUrl = Deno.env.get("APP_URL") || "https://chief-of-staff-aimee.lovable.app";

    // Fetch all data in parallel
    const [
      overdueTasks,
      todayTasks,
      upcomingTasks,
      ideasInProgress,
      upcomingMaintenance,
      handoffSummaries,
      briefing,
      calendarData,
      newsData,
    ] = await Promise.all([
      fetchOverdueTasks(supabase),
      fetchTodayTasks(supabase),
      fetchUpcomingTasks(supabase),
      fetchIdeasInProgress(supabase),
      fetchUpcomingMaintenance(supabase),
      fetchHandoffSummaries(supabase),
      callEdgeFunction(supabaseUrl, serviceRoleKey, "daily-briefing"),
      callEdgeFunction(supabaseUrl, serviceRoleKey, "get-todays-calendar", { days: 3 }),
      callEdgeFunction(supabaseUrl, serviceRoleKey, "ai-news"),
    ]);

    // Build email
    const htmlContent = buildBriefingHtml({
      briefing,
      overdueTasks,
      todayTasks,
      upcomingTasks,
      ideasInProgress,
      upcomingMaintenance,
      handoffSummaries,
      calendarData,
      newsData,
      appUrl,
    });

    const now = new Date();
    const dayName = DAYS[now.getDay()];
    const dateStr = `${MONTHS[now.getMonth()]} ${now.getDate()}`;
    const subject = `Good morning, Aimee — Your ${dayName} Briefing (${dateStr})`;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CoS Digest <cos@genai-aims.com>",
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error ${res.status}: ${err}`);
    }

    const result = await res.json();

    return new Response(
      JSON.stringify({
        sent: true,
        resendId: result.id,
        sections: {
          overdue: overdueTasks.length,
          today: todayTasks.length,
          upcoming: upcomingTasks.length,
          ideas: ideasInProgress.length,
          maintenance: upcomingMaintenance.length,
          handoffs: handoffSummaries.length,
          briefing: !!briefing,
          calendar: !!calendarData,
          news: newsData?.articles?.length ?? 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-daily-digest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
