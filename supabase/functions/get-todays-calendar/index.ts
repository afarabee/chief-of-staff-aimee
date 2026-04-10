import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createServiceAccountJWT(
  serviceKey: { client_email: string; private_key: string }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceKey.client_email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemBody = serviceKey.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    )
  );

  return `${unsignedToken}.${base64url(signature)}`;
}

async function getAccessToken(serviceKey: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const jwt = await createServiceAccountJWT(serviceKey);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string;
  allDay: boolean;
  source: string;
}

async function fetchCalendarEvents(
  calendarId: string,
  accessToken: string,
  timeMin: string,
  timeMax: string,
  source: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Calendar API error for ${source} (${calendarId}): ${res.status} ${errText}`);
    return [];
  }

  const data = await res.json();

  return (data.items || [])
    .filter((e: any) => e.status !== "cancelled")
    .map((e: any) => ({
      id: e.id,
      summary: e.summary || "(No title)",
      start: e.start?.dateTime || e.start?.date || "",
      end: e.end?.dateTime || e.end?.date || "",
      htmlLink: e.htmlLink || "",
      allDay: !!e.start?.date,
      source,
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceKeyJson = Deno.env.get("GOOGLE_CALENDAR_SERVICE_KEY");
    const appCalendarId = Deno.env.get("GOOGLE_CALENDAR_ID");
    const personalCalendarId = Deno.env.get("GOOGLE_PERSONAL_CALENDAR_ID");

    if (!serviceKeyJson || (!appCalendarId && !personalCalendarId)) {
      return new Response(
        JSON.stringify({ error: "Google Calendar not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let days = 1;
    try {
      const body = await req.json();
      if (body?.days && Number.isInteger(body.days) && body.days > 0 && body.days <= 7) {
        days = body.days;
      }
    } catch {
      // No body or invalid JSON — use default
    }

    const serviceKey = JSON.parse(serviceKeyJson);
    const accessToken = await getAccessToken(serviceKey);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + days * 24 * 60 * 60 * 1000);
    const timeMin = startOfDay.toISOString();
    const timeMax = endOfDay.toISOString();

    // Fetch from all configured calendars in parallel
    const fetches: Promise<CalendarEvent[]>[] = [];
    if (appCalendarId) {
      fetches.push(fetchCalendarEvents(appCalendarId, accessToken, timeMin, timeMax, "app"));
    }
    if (personalCalendarId) {
      fetches.push(fetchCalendarEvents(personalCalendarId, accessToken, timeMin, timeMax, "personal"));
    }

    const results = await Promise.all(fetches);
    const allEvents = results.flat();

    // Deduplicate by event ID
    const seen = new Set<string>();
    const unique = allEvents.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    // Sort by start time
    unique.sort((a, b) => a.start.localeCompare(b.start));

    return new Response(
      JSON.stringify({ events: unique }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("get-todays-calendar error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
