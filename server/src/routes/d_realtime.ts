import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (_req, res, next) => {
    try {
        const rows = await prisma.$queryRaw<
            Array<{ rowid: number; datasource: string; stationid: string; sampledate: Date; parameter: string; resultvalue: number }>
        >`SELECT * FROM d_realtime ORDER BY rowid ASC limit 10`;

        res.json(rows);
    } catch (e) { next(e); }
});

export default router;
