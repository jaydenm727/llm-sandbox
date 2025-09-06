import OpenAI from "openai";
import type { QuerySpec } from "../types/querySpec";

// Reuse your local LM Studio endpoint
const client = new OpenAI({
    baseURL: "http://localhost:1234/v1",
    apiKey: "lm-studio",
    dangerouslyAllowBrowser: true,
});

type SummaryInput = {
    spec: QuerySpec;
    rows: any[]; // rows from /api/d_realtime/query
};

/**
 * Summarize results into short, readable bullets.
 * - Caps rows to avoid token blowups
 * - Rounds numbers for readability
 */
export async function summarizeResults(input: SummaryInput): Promise<string> {
    const MAX_ROWS = 300;          // adjust if needed
    const PRECISION = 3;           // decimals for floats

    const trimmed = input.rows.slice(0, MAX_ROWS).map((r) => {
        const o: Record<string, any> = {};
        for (const [k, v] of Object.entries(r)) {
            if (typeof v === "number") {
                // keep ints as-is, round floats
                o[k] = Number.isInteger(v) ? v : Number(v.toFixed(PRECISION));
            } else {
                o[k] = v;
            }
        }
        return o;
    });

    const payload = {
        spec: input.spec,
        meta: {
            row_count: input.rows.length,
            row_count_included: trimmed.length,
            truncated: input.rows.length > trimmed.length,
        },
        rows: trimmed,
    };

    const system = [
        "You are a precise data summarizer for time-series weather metrics.",
        "You will receive a JSON payload with:",
        " - spec: the query spec (station, parameter, date range, ops, group_by)",
        " - meta: counts, truncation flag",
        " - rows: the result rows from the API",
        "Write a concise summary for a non-technical user.",
        "Rules:",
        "- Be brief: 3–6 bullet points max with a breif summary following the bulletpoints.",
        "- If grouped (rows have `bucket`), describe trends over time and notable highs/lows.",
        "- If ungrouped (single row), report the requested aggregations.",
        "- Mention station, parameter, and date range explicitly.",
        "- Use units only if present in parameter name (e.g., TempA_F → °F).",
        "- If `meta.truncated` is true, note that the summary is based on a subset of rows.",
        "- Do not invent numbers; only use what’cd s in the payload.",
        "- If you include a table, use GitHub Flavored Markdown with each row on its own line.",
        "- Keep numbers readable (no excessive decimals).",
    ].join("\n");

    const user = "JSON payload:\n```json\n" + JSON.stringify(payload) + "\n```";

    const resp = await client.chat.completions.create({
        model: "qwen2.5-14b-instruct",
        temperature: 0,
        messages: [
            { role: "system", content: system },
            { role: "user", content: user }
        ]
    });

    return resp.choices[0]?.message?.content?.trim() || "";
}
