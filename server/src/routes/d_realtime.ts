import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

// Existing simple GET (kept)
router.get("/", async (_req, res, next) => {
    try {
        const rows = await prisma.$queryRaw<
            Array<{ rowid: number; datasource: string; stationid: string; sampledate: Date; parameter: string; resultvalue: number }>
        >`SELECT rowid, datasource, stationid, sampledate, parameter, resultvalue
      FROM d_realtime
      ORDER BY rowid ASC`;
        res.json(rows);
    } catch (e) { next(e); }
});

// ---------- NEW: query-by-JSON spec ----------
const QuerySpec = z.object({
    datasource: z.string().min(1).default("NOAA_NWS"),
    station: z.string().min(1),
    parameter: z.string().min(1).default("TempA_F"), // add parameter to your spec
    time_range: z.object({
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    }),
    ops: z.array(z.enum(["avg", "min", "max", "count"])).nonempty(),
    group_by: z.enum(["none", "day", "week", "month"]).default("none")
});

router.post("/query", async (req, res, next) => {
    try {
        const spec = QuerySpec.parse(req.body);

        // Build dynamic SELECT agg list safely (whitelist only)
        const aggCols: string[] = [];
        for (const op of spec.ops) {
            // all operate on numeric resultvalue
            if (op === "count") aggCols.push(`COUNT(*)::int AS "count"`);
            if (op === "avg") aggCols.push(`AVG(resultvalue)::float8 AS "avg"`);
            if (op === "min") aggCols.push(`MIN(resultvalue)::float8 AS "min"`);
            if (op === "max") aggCols.push(`MAX(resultvalue)::float8 AS "max"`);
        }

        // Grouping expression
        let groupExpr = "";
        let selectBucket = "";
        let groupByClause = "";
        if (spec.group_by !== "none") {
            // whitelist to avoid injection
            const gb = spec.group_by; // "day" | "week" | "month"
            selectBucket = `date_trunc('${gb}', sampledate) AS bucket`;
            groupExpr = "bucket";
            groupByClause = "GROUP BY bucket, datasource, stationid, parameter ORDER BY bucket ASC";
        } else {
            groupByClause = "GROUP BY datasource, stationid, parameter"; // no grouping
        }

        // Build final SELECT
        // Always include stationid & parameter for clarity; include bucket only if grouping
        const selectPieces = [
            ...(selectBucket ? [selectBucket] : []),
            `datasource`,
            `stationid`,
            `parameter`,
            ...aggCols
        ];
        const selectSQL = selectPieces.join(", ");

        // Filter params (use parameterized values)
        const startTs = spec.time_range.start + " 00:00:00";
        const endTs = spec.time_range.end + " 23:59:59";

        // Compose full SQL text. We only interpolate whitelisted identifiers (selectSQL/groupByClause),
        // while all user data goes as bind parameters to avoid injection.
        const sql = `
  WITH filtered AS (
    SELECT datasource, stationid, parameter, sampledate, resultvalue
    FROM d_realtime
    WHERE datasource = $1
      AND stationid  = $2
      AND parameter  = $3
      AND sampledate BETWEEN $4::timestamptz AND $5::timestamptz
  )
  SELECT ${selectSQL}
  FROM filtered
  ${groupByClause}
`;

        console.log(sql);

        // Use $queryRawUnsafe for the dynamic text, but keep values parameterized
        const rows = await prisma.$queryRawUnsafe<any[]>(
            sql,
            spec.datasource,   // $1
            spec.station,      // $2
            spec.parameter,    // $3
            startTs,           // $4
            endTs              // $5
        );


        res.json(rows);
    } catch (e) { next(e); }
});

export default router;
