import { Response } from "express";
import { controller, httpGet, httpPost, httpPut, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import {
  EventCreateSchema,
  EventUpdateSchema,
  EventView,
  CONTENT_ROLES,
} from "@liss11/shared";
import { Prisma } from "@prisma/client";
import { TYPES } from "../types";
import { EventRepository, EventWithMeta } from "../repositories/event.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(e: EventWithMeta): EventView {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    coverUrl: e.coverUrl,
    isPublic: e.isPublic,
    rsvpCount: e._count.rsvps,
    isAttending: e.rsvps.length > 0,
  };
}

function toData(body: {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
}): Prisma.EventUncheckedUpdateInput {
  const data: Prisma.EventUncheckedUpdateInput = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.location !== undefined) data.location = body.location;
  if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl;
  if (body.isPublic !== undefined) data.isPublic = body.isPublic;
  if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt);
  if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
  return data;
}

const writeGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

// Reads are public (per-event visibility): guests see public events only,
// members see all. Writes need a content role; RSVP needs any logged-in member.
@controller("/events")
export class EventController {
  constructor(@inject(TYPES.EventRepository) private repo: EventRepository) {}

  @httpGet("/", optionalAuth)
  async list(req: AuthedRequest, res: Response) {
    const events = await this.repo.list(req.auth?.memberId ?? null);
    res.json({ events: events.map(toView) });
  }

  @httpGet("/:id", optionalAuth)
  async detail(req: AuthedRequest, res: Response) {
    const event = await this.repo.findById(req.params.id, req.auth?.memberId ?? null);
    if (!event) return res.status(404).json({ error: "Event not found" });
    // Don't leak a members-only event to a guest.
    if (!event.isPublic && !req.auth) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json({ event: toView(event) });
  }

  @httpPost("/", ...writeGuards, validateBody(EventCreateSchema))
  async create(req: AuthedRequest, res: Response) {
    try {
      const created = await this.repo.create(
        toData(req.body) as Prisma.EventUncheckedCreateInput,
      );
      const event = await this.repo.findById(created.id, req.auth!.memberId);
      res.status(201).json({ event: toView(event!) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not create event" });
    }
  }

  @httpPut("/:id", ...writeGuards, validateBody(EventUpdateSchema))
  async update(req: AuthedRequest, res: Response) {
    try {
      await this.repo.update(req.params.id, toData(req.body));
      const event = await this.repo.findById(req.params.id, req.auth!.memberId);
      res.json({ event: toView(event!) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Event not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update event" });
    }
  }

  @httpDelete("/:id", ...writeGuards)
  async remove(req: AuthedRequest, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Event not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete event" });
    }
  }

  // --- RSVP (any logged-in member) ---

  @httpPost("/:id/rsvp", requireAuth)
  async rsvp(req: AuthedRequest, res: Response) {
    try {
      await this.repo.rsvp(req.params.id, req.auth!.memberId);
      const event = await this.repo.findById(req.params.id, req.auth!.memberId);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json({ event: toView(event) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2003") {
        return res.status(404).json({ error: "Event not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not RSVP" });
    }
  }

  @httpDelete("/:id/rsvp", requireAuth)
  async cancelRsvp(req: AuthedRequest, res: Response) {
    try {
      await this.repo.cancelRsvp(req.params.id, req.auth!.memberId);
      const event = await this.repo.findById(req.params.id, req.auth!.memberId);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json({ event: toView(event) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not cancel RSVP" });
    }
  }
}
