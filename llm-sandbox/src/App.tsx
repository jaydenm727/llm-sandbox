import { useState } from "react";
import ReactMarkdown from "react-markdown";
import OpenAI from "openai";
import { QuerySpecSchema, type QuerySpec } from "./types/querySpec";
import { extractFirstJsonObject } from "./lib/extractJson";
import { queryRealtime } from "./api/drealtime";
import { summarizeResults } from "./lib/summarize";  // 👈 new
import remarkGfm from "remark-gfm";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [llmJson, setLlmJson] = useState<string>("");
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>(""); // 👈 new

  // LM Studio local client
  const client = new OpenAI({
    baseURL: "http://localhost:1234/v1",
    apiKey: "lm-studio",
    dangerouslyAllowBrowser: true
  });

  async function buildQueryWithLLM(nlQuery: string): Promise<QuerySpec> {
    const system = [
      "You are a query planner for a weather-timeseries API.",
      "Return ONLY a JSON object matching this schema and nothing else:",
      "{ datasource: string, station: string, parameter: string, time_range: {start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'},",
      "  ops: ['avg'|'min'|'max'|'count'][], group_by: 'none'|'day'|'week'|'month' }",
      "Rules:",
      "- If datasource not provided, use 'NOAA_NWS'.",
      "- If parameter not provided, use 'TempA_F'.",
      "- If ops not provided, use ['avg','min','max','count'].",
      "- If group_by not provided, use 'none'.",
      "- If a date range is not present or unclear, DO NOT guess; instead return:",
      `  { "error": "missing_dates", "message": "Please provide a start and end date (YYYY-MM-DD)." }`,
      "Examples:",
      `Q: "Average air temp for K42J yesterday"`,
      `A: {"datasource":"NOAA_NWS","station":"K42J","parameter":"TempA_F","time_range":{"start":"2025-08-31","end":"2025-08-31"},"ops":["avg"],"group_by":"none"}`,
      `Q: "K42J min/max temps for 2025-08-30 to 2025-08-31 by day"`,
      `A: {"datasource":"NOAA_NWS","station":"K42J","parameter":"TempA_F","time_range":{"start":"2025-08-30","end":"2025-08-31"},"ops":["min","max"],"group_by":"day"}`
    ].join("\n");

    const user = `User request: """${nlQuery}"""`;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let obj: any;
    try {
      obj = extractFirstJsonObject(raw);
    } catch {
      throw new Error("The model did not return valid JSON.");
    }

    // If the LLM returned an error object, surface it
    if (obj?.error) {
      throw new Error(obj.message || "Query is missing required fields.");
    }

    // Validate against the schema
    const spec = QuerySpecSchema.parse(obj);
    return spec;
  }

  async function run() {
    setLoading(true);
    setError(null);
    setRows(null);
    setLlmJson("");
    setSummary(""); // reset

    try {
      // 1) Ask LLM for JSON spec
      const spec = await buildQueryWithLLM(inputValue);
      setLlmJson("```json\n" + JSON.stringify(spec, null, 2) + "\n```");

      // 2) Call your API
      const data = await queryRealtime(spec);

      // 3) Show results
      setRows(data);
      const s = await summarizeResults({ spec, rows: data });
      setSummary(s || "_No summary produced._");
    } catch (e: any) {
      setError(e?.message || "Failed to run query");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Natural language → JSON → API</h2>

      <div className="input-group mb-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="form-control"
          placeholder='e.g., "K42J temp stats 2025-08-30 to 2025-08-31 by day"'
        />
        <button className="btn btn-primary" type="button" onClick={run}>
          Submit
        </button>
      </div>

      {loading && (
        <div className="d-flex justify-content-center my-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {rows && (
        <>
          <h5 className="mt-4">Summary</h5>
          <div className="p-3 rounded border">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => <table className="table table-sm">{children}</table>,
                thead: ({ children }) => <thead className="table-light">{children}</thead>,
                td: ({ children }) => <td className="align-middle">{children}</td>,
                th: ({ children }) => <th className="align-middle">{children}</th>,
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>

          <h5 className="mt-4">Results</h5>
          <pre className="p-3 rounded border">{JSON.stringify(rows, null, 2)}</pre>
        </>
      )}

      {llmJson && (
        <>
          <h5 className="mt-4">LLM Query Spec</h5>
          <ReactMarkdown>{llmJson}</ReactMarkdown>
        </>
      )}
    </div>
  );
}

export default App;