import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";
import itemsRouter from "./routes/d_items";
import realtimeRouter from './routes/d_realtime';

const app = express();
const logger = pino({ level: process.env.NODE_ENV === "production" ? "info" : "debug" });

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: ["http://localhost:5173"], credentials: true })); // Vite default
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/d_items", itemsRouter);
app.use("/api/d_realtime", realtimeRouter);

// basic error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err?.status ?? 500;
  res.status(status).json({ error: err?.code ?? "internal_error", message: err?.message ?? "Server error" });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  logger.info(`API listening on :${port}`);
});
