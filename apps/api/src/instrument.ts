import * as Sentry from "@sentry/node";
import type { Application } from "express";

// Error monitoring. Enabled only when SENTRY_DSN is set, so local dev and CI
// need no account (same graceful-fallback pattern as Resend). This module is
// imported first in server.ts so Sentry's auto-instrumentation loads before
// Express/HTTP.
const dsn = process.env.SENTRY_DSN;
export const sentryEnabled = Boolean(dsn);

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
  // eslint-disable-next-line no-console
  console.log("[sentry] error monitoring enabled");
} else {
  // eslint-disable-next-line no-console
  console.log("[sentry] SENTRY_DSN not set - error monitoring disabled");
}

/** Logs an error and reports it to Sentry when enabled. Use in catch blocks. */
export function captureError(err: unknown): void {
  // eslint-disable-next-line no-console
  console.error(err);
  if (sentryEnabled) Sentry.captureException(err);
}

/** Attaches Sentry's Express error handler (catches uncaught route errors). */
export function attachSentryErrorHandler(app: Application): void {
  if (sentryEnabled) Sentry.setupExpressErrorHandler(app);
}
