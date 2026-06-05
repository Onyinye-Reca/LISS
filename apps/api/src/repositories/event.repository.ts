import { inject, injectable } from "inversify";
import { PrismaClient, Event, Prisma } from "@prisma/client";
import { TYPES } from "../types";

// Event plus rsvp count and (filtered to one member) that member's own rsvp.
export type EventWithMeta = Prisma.EventGetPayload<{
  include: {
    _count: { select: { rsvps: true } };
    rsvps: { select: { id: true } };
  };
}>;

@injectable()
export class EventRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  // Include the total rsvp count and, scoped to the requesting member, their
  // own rsvp row (so we can show "you're attending"). For guests (no member),
  // an empty memberId matches no rsvp, so isAttending is always false.
  private meta(memberId: string | null) {
    return {
      _count: { select: { rsvps: true } },
      rsvps: { where: { memberId: memberId ?? "" }, select: { id: true } },
    };
  }

  // Guests see only public events; logged-in members see all.
  list(memberId: string | null): Promise<EventWithMeta[]> {
    return this.prisma.event.findMany({
      where: memberId ? {} : { isPublic: true },
      orderBy: [{ startsAt: "asc" }],
      include: this.meta(memberId),
    });
  }

  findById(id: string, memberId: string | null): Promise<EventWithMeta | null> {
    return this.prisma.event.findUnique({
      where: { id },
      include: this.meta(memberId),
    });
  }

  create(data: Prisma.EventUncheckedCreateInput): Promise<Event> {
    return this.prisma.event.create({ data });
  }

  update(id: string, data: Prisma.EventUncheckedUpdateInput): Promise<Event> {
    return this.prisma.event.update({ where: { id }, data });
  }

  delete(id: string): Promise<Event> {
    return this.prisma.event.delete({ where: { id } });
  }

  // Idempotent: a second RSVP is a no-op (unique [eventId, memberId]).
  rsvp(eventId: string, memberId: string) {
    return this.prisma.eventRsvp.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      create: { eventId, memberId },
      update: {},
    });
  }

  // deleteMany so cancelling a non-existent rsvp doesn't throw.
  cancelRsvp(eventId: string, memberId: string) {
    return this.prisma.eventRsvp.deleteMany({ where: { eventId, memberId } });
  }
}
