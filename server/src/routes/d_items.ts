import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: number; embedding: string }>
    >`SELECT id, embedding::text as embedding FROM d_items ORDER BY id ASC`;

    res.json(rows);
  } catch (e) { next(e); }
});

export default router;
