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
- purchase_price: The total price/amount paid (number, null if not found)
- notes: Any relevant details like serial number, store name, order number
- category_hint: Suggest a category from common home categories (e.g., "Appliances", "Electronics", "Furniture", "HVAC", "Plumbing", "Electrical", "Outdoor", "Kitchen", "Bathroom", "Tools")
- warranty_expiry_date: Warranty expiration date in YYYY-MM-DD format (null if not found)
- warranty_notes: Warranty coverage details (null if not found)

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
                      purchase_price: { type: "number", description: "Total price paid", nullable: true },
                      notes: { type: "string", description: "Additional details", nullable: true },
                      category_hint: { type: "string", description: "Suggested category", nullable: true },
                      warranty_expiry_date: { type: "string", description: "Warranty expiry in YYYY-MM-DD format", nullable: true },
                      warranty_notes: { type: "string", description: "Warranty coverage details", nullable: true },
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
      // Gemini API may use either "arguments" or "args" depending on version
      const args = functionCall.functionCall.arguments || functionCall.functionCall.args;
      if (args) {
        return new Response(JSON.stringify({ parsed: args }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Function call found but no arguments:", JSON.stringify(functionCall));
    }

    // Fallback: try to parse text response as JSON
    const rawText = parts[0]?.text || "";
    if (rawText) {
      try {
        // Try to extract JSON from the text (may be wrapped in markdown code block)
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.name) {
            return new Response(JSON.stringify({ parsed }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch {
        // JSON parsing failed, fall through to error
      }
    }

    console.error("No function call in response. Full response:", JSON.stringify(geminiData));
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
