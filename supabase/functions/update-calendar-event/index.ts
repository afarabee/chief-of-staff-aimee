import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StructuredFrequency {
  interval: number;
  unit: "days" | "weeks" | "months" | "years";
}

function frequencyToRRule(freq: StructuredFrequency): string {
  const unitMap: Record<string, string> = {
    days: "DAILY",
    weeks: "WEEKLY",
    months: "MONTHLY",
    years: "YEARLY",
  };
  const rruleFreq = unitMap[freq.unit] || "MONTHLY";
  if (freq.interval === 1) {
    return `RRULE:FREQ=${rruleFreq}`;
  }
  return `RRULE:FREQ=${rruleFreq};INTERVAL=${freq.interval}`;
}

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
    scope: "https://www.googleapis.com/auth/calendar",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_id, summary, description, start_date, frequency } = await req.json();

    if (!event_id || !summary || !start_date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event_id, summary, start_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceKeyJson = Deno.env.get("GOOGLE_CALENDAR_SERVICE_KEY");
    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID");

    if (!serviceKeyJson || !calendarId) {
      return new Response(
        JSON.stringify({ error: "Google Calendar not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceKey = JSON.parse(serviceKeyJson);
    const accessToken = await getAccessToken(serviceKey);

    // Build updated event body
    const eventBody: Record<string, any> = {
      summary,
      description: description || "",
      start: { date: start_date },
      end: { date: start_date },
    };

    if (frequency && frequency.interval && frequency.unit) {
      eventBody.recurrence = [frequencyToRRule(frequency)];
    } else {
      // Explicitly clear recurrence if none provided
      eventBody.recurrence = [];
    }

    // PATCH the existing event — updates all occurrences for a recurring series
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event_id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!calRes.ok) {
      const errText = await calRes.text();
      console.error("Google Calendar API error:", calRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to update calendar event", detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calData = await calRes.json();

    return new Response(
      JSON.stringify({ eventId: calData.id, htmlLink: calData.htmlLink }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("update-calendar-event error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
