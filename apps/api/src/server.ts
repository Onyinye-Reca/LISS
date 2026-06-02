import "reflect-metadata"; // MUST be first — Inversify decorators depend on it
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { InversifyExpressServer } from "inversify-express-utils";
import { buildContainer } from "./inversify.config";

// Import controllers so their decorators register with the container.
import "./controllers/health.controller";
import "./controllers/auth.controller";

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:5173";

const container = buildContainer();

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
  app.use(helmet());
  app.use(
    cors({
      origin: WEB_ORIGIN, // exact origin, never "*" with credentials
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  // Brute-force protection on auth (PRD 7.2): 5 attempts / 15 min.
  app.use(
    "/auth/login",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true }),
  );
});

const app = server.build();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT} (web origin: ${WEB_ORIGIN})`);
});
