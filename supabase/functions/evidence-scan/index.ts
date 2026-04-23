// Edge function: AI-driven evidence verification.
// Accepts a control description + supporting evidence (text/code/file content)
// and returns a structured compliance verdict via Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScanRequest {
  control: {
    id: string;
    title: string;
    objective: string;
    steps: string[];
    evidence: string[];
    citations: string[];
  };
  evidence: {
    kind: "text" | "file" | "code";
    filename?: string;
    language?: string;
    content: string;
  };
}

const SYSTEM_PROMPT = `You are an AI Governance Auditor evaluating evidence against a specific control.
You have deep familiarity with EU AI Act, NIST AI RMF, ISO/IEC 42001, UK AI Principles,
Singapore AI Verify and Taiwan FSC AI guidelines.

Be strict but fair. Only mark PASS when the evidence demonstrably satisfies the control's
required outputs. Use PARTIAL when intent is shown but key artifacts are missing.
Use FAIL when evidence is irrelevant or contradicts the requirement.
Never accept marketing claims, intentions, or "we plan to" statements as PASS.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as ScanRequest;
    if (!body?.control || !body?.evidence?.content) {
      return new Response(JSON.stringify({ error: "Missing control or evidence" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncated = body.evidence.content.slice(0, 18000);

    const userPrompt = `# CONTROL UNDER REVIEW
ID: ${body.control.id}
Title: ${body.control.title}
Objective: ${body.control.objective}

## Required Implementation Steps
${body.control.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Required Evidence Artifacts
${body.control.evidence.map((e) => `- ${e}`).join("\n")}

## Aligned Standards
${body.control.citations.join("; ")}

# EVIDENCE SUBMITTED (${body.evidence.kind}${
      body.evidence.filename ? `, file: ${body.evidence.filename}` : ""
    }${body.evidence.language ? `, language: ${body.evidence.language}` : ""})
\`\`\`
${truncated}
\`\`\`
${body.evidence.content.length > truncated.length ? "\n[... truncated ...]" : ""}

Evaluate whether the submitted evidence satisfies the control. Cite specific lines or sections when possible.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_compliance",
                description: "Return structured compliance verdict",
                parameters: {
                  type: "object",
                  properties: {
                    verdict: {
                      type: "string",
                      enum: ["PASS", "PARTIAL", "FAIL"],
                    },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    rationale: { type: "string" },
                    matched_requirements: {
                      type: "array",
                      items: { type: "string" },
                    },
                    missing_requirements: {
                      type: "array",
                      items: { type: "string" },
                    },
                    citations: { type: "array", items: { type: "string" } },
                  },
                  required: [
                    "verdict",
                    "confidence",
                    "rationale",
                    "matched_requirements",
                    "missing_requirements",
                    "citations",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "report_compliance" },
          },
        }),
      }
    );

    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limited. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiResponse.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add funds in Workspace Settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiResponse.ok) {
      const t = await aiResponse.text();
      console.error("AI gateway error", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return verdict" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("evidence-scan error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
