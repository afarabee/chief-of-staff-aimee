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

/** Convert structured frequency to Google Calendar RRULE string */
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

/** Base64url encode (no padding) */
function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Create a signed JWT for Google service account auth */
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

  // Parse PEM private key
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

/** Exchange JWT for Google access token */
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
    const { summary, description, start_date, frequency, start_time, time_zone, reminders } = await req.json();

    // Validate required fields
    if (!summary || !start_date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: summary, start_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load secrets
    const serviceKeyJson = Deno.env.get("GOOGLE_CALENDAR_SERVICE_KEY");
    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID");

    if (!serviceKeyJson || !calendarId) {
      console.error("Missing secrets: GOOGLE_CALENDAR_SERVICE_KEY or GOOGLE_CALENDAR_ID");
      return new Response(
        JSON.stringify({ error: "Google Calendar not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceKey = JSON.parse(serviceKeyJson);

    // Get access token
    const accessToken = await getAccessToken(serviceKey);

    // Build event body
    const eventBody: Record<string, any> = {
      summary,
      description: description || "",
    };

    if (start_time && time_zone) {
      // Timed event — 1 hour duration
      const startDateTime = `${start_date}T${start_time}:00`;
      const [hours, minutes] = start_time.split(":").map(Number);
      const endHours = hours + 1;
      const endTime = `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      const endDateTime = `${start_date}T${endTime}:00`;
      eventBody.start = { dateTime: startDateTime, timeZone: time_zone };
      eventBody.end = { dateTime: endDateTime, timeZone: time_zone };
    } else {
      // All-day event
      eventBody.start = { date: start_date };
      eventBody.end = { date: start_date };
    }

    // Add recurrence if frequency provided
    if (frequency && frequency.interval && frequency.unit) {
      eventBody.recurrence = [frequencyToRRule(frequency)];
    }

    // Add reminders if provided
    if (reminders && Array.isArray(reminders) && reminders.length > 0) {
      eventBody.reminders = {
        useDefault: false,
        overrides: reminders.map((minutes: number) => ({ method: "popup", minutes })),
      };
    }

    // Create event via Google Calendar API
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
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
        JSON.stringify({ error: "Failed to create calendar event" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calData = await calRes.json();

    return new Response(
      JSON.stringify({
        eventId: calData.id,
        htmlLink: calData.htmlLink,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("create-calendar-event error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
