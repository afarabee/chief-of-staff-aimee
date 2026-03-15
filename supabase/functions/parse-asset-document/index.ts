import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { file_url } = await req.json();

    if (!file_url) {
      return new Response(JSON.stringify({ error: "Missing file_url" }), {
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

    // Fetch the file and base64-encode it
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileBytes = new Uint8Array(await fileRes.arrayBuffer());
    const contentType = fileRes.headers.get("content-type") || "application/octet-stream";

    // Convert to base64
    let binary = "";
    for (let i = 0; i < fileBytes.length; i++) {
      binary += String.fromCharCode(fileBytes[i]);
    }
    const base64Data = btoa(binary);

    const prompt = `You are analyzing a receipt, invoice, or product document to extract asset information for a home management system.

Extract the following fields from the document:
- name: The primary product/asset name (be specific, include brand and model if visible)
- description: A brief description of the asset
- purchase_date: The purchase/transaction date in YYYY-MM-DD format (null if not found)
- notes: Any relevant details like warranty info, serial number, store name, order number, price
- category_hint: Suggest a category from common home categories (e.g., "Appliances", "Electronics", "Furniture", "HVAC", "Plumbing", "Electrical", "Outdoor", "Kitchen", "Bathroom", "Tools")

If the document contains multiple items, focus on the most prominent/expensive one.
If a field cannot be determined, use null.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: contentType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              function_declarations: [
                {
                  name: "extract_asset",
                  description: "Extract asset details from a document",
                  parameters: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Asset name" },
                      description: { type: "string", description: "Brief description", nullable: true },
                      purchase_date: { type: "string", description: "Date in YYYY-MM-DD format", nullable: true },
                      notes: { type: "string", description: "Additional details", nullable: true },
                      category_hint: { type: "string", description: "Suggested category", nullable: true },
                    },
                    required: ["name"],
                  },
                },
              ],
            },
          ],
          tool_config: {
            function_calling_config: { mode: "ANY" },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to parse document" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();

    // Extract from tool call response
    const candidate = geminiData?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCall = parts.find((p: any) => p.functionCall);

    if (functionCall) {
      const args = functionCall.functionCall.arguments;
      return new Response(JSON.stringify({ parsed: args }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse text response
    const rawText = parts[0]?.text || "";
    console.error("No function call in response, raw text:", rawText);
    return new Response(JSON.stringify({ error: "Could not extract asset details from document" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-asset-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
