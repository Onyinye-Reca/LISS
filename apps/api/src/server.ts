import "./instrument"; // MUST be first. Sentry instrumentation before Express
import "reflect-metadata"; // Inversify decorators depend on this
import express from "express";
import { join } from "path";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { InversifyExpressServer } from "inversify-express-utils";
import { buildContainer } from "./inversify.config";
import { TYPES } from "./types";
import { MemberRepository } from "./repositories/member.repository";
import { configureAuthLookup } from "./middleware/auth";
import { attachSentryErrorHandler } from "./instrument";

import { requireCsrf } from "./middleware/csrf";

// Import controllers so their decorators register with the container.
import "./controllers/health.controller";
import "./controllers/auth.controller";
import "./controllers/csrf.controller";
import "./controllers/contact.controller";
import "./controllers/upload.controller";
import "./controllers/officer.controller";
import "./controllers/bot-member.controller";
import "./controllers/region.controller";
import "./controllers/announcement.controller";
import "./controllers/album.controller";
import "./controllers/event.controller";
import "./controllers/financial-statement.controller";
import "./controllers/blog-post.controller";
import "./controllers/site-setting.controller";

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:5173";

const container = buildContainer();

// Let the auth guard verify sessions against the DB (role + tokenVersion),
// so a password reset invalidates outstanding sessions.
const memberRepository = container.get<MemberRepository>(TYPES.MemberRepository);
configureAuthLookup((id) => memberRepository.findAuthInfo(id));

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

  // Serve locally-stored uploads (no-op when Cloudinary is used). GET only.
  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  // CSRF guard on all mutating requests (skips GET/HEAD/OPTIONS). Must come
  // after cookieParser so req.cookies is populated.
  app.use(requireCsrf);

  // Brute-force protection on auth (PRD 7.2): 5 attempts / 15 min.
  app.use(
    "/auth/login",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true }),
  );

  // Throttle verification re-sends to curb email abuse.
  app.use(
    "/auth/resend-verification",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 3, standardHeaders: true }),
  );

  // Throttle password-reset requests (curb email abuse + enumeration probing).
  app.use(
    "/auth/forgot-password",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 3, standardHeaders: true }),
  );
  app.use(
    "/auth/reset-password",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true }),
  );

  // Throttle contact submissions to curb spam.
  app.use(
    "/contact",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true }),
  );
});

const app = server.build();

// Must come after routes are registered: catches uncaught route errors.
attachSentryErrorHandler(app);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT} (web origin: ${WEB_ORIGIN})`);
});
