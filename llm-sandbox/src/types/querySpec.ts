import { z } from "zod";

// Same contract as your server route:
export const QuerySpecSchema = z.object({
  datasource: z.string().min(1).default("NOAA_NWS"),
  station: z.string().min(1),
  parameter: z.string().min(1), // e.g., "TempA_F"
  time_range: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  ops: z.array(z.enum(["avg", "min", "max", "count"])).nonempty(),
  group_by: z.enum(["none", "day", "week", "month"]).default("none"),
});

export type QuerySpec = z.infer<typeof QuerySpecSchema>;
