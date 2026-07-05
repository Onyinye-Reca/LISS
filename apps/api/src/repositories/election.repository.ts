import { inject, injectable } from "inversify";
import {
  PrismaClient,
  Election,
  Position,
  Candidate,
  Prisma,
} from "@prisma/client";
import { TYPES } from "../types";

export type ElectionWithBallot = Election & {
  positions: (Position & { candidates: Candidate[] })[];
};
export type ElectionWithCount = Election & { _count: { positions: number } };

@injectable()
export class ElectionRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  list(): Promise<ElectionWithCount[]> {
    return this.prisma.election.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { positions: true } } },
    });
  }

  findById(id: string): Promise<ElectionWithBallot | null> {
    return this.prisma.election.findUnique({
      where: { id },
      include: {
        positions: {
          orderBy: { title: "asc" },
          include: { candidates: { orderBy: { name: "asc" } } },
        },
      },
    });
  }

  create(data: {
    title: string;
    opensAt: Date | null;
    closesAt: Date | null;
  }): Promise<Election> {
    return this.prisma.election.create({ data });
  }

  update(id: string, data: Prisma.ElectionUncheckedUpdateInput): Promise<Election> {
    return this.prisma.election.update({ where: { id }, data });
  }

  delete(id: string): Promise<Election> {
    return this.prisma.election.delete({ where: { id } });
  }

  createPosition(electionId: string, title: string): Promise<Position> {
    return this.prisma.position.create({ data: { electionId, title } });
  }

  deletePosition(id: string): Promise<Position> {
    return this.prisma.position.delete({ where: { id } });
  }

  createCandidate(
    positionId: string,
    data: { name: string; manifesto: string | null },
  ): Promise<Candidate> {
    return this.prisma.candidate.create({
      data: { positionId, name: data.name, manifesto: data.manifesto },
    });
  }

  deleteCandidate(id: string): Promise<Candidate> {
    return this.prisma.candidate.delete({ where: { id } });
  }

  /** Positions the member has already voted for in this election. */
  async votedPositionIds(memberId: string, electionId: string): Promise<Set<string>> {
    const votes = await this.prisma.vote.findMany({
      where: { memberId, electionId },
      select: { positionId: true },
    });
    return new Set(votes.map((v) => v.positionId));
  }

  /** Election IDs the member has cast at least one vote in (for list badges). */
  async memberVotedElectionIds(memberId: string): Promise<Set<string>> {
    const votes = await this.prisma.vote.findMany({
      where: { memberId },
      distinct: ["electionId"],
      select: { electionId: true },
    });
    return new Set(votes.map((v) => v.electionId));
  }

  /** All (positionId, candidateId) votes for an election, for tallying. */
  electionVotes(
    electionId: string,
  ): Promise<{ positionId: string; candidateId: string }[]> {
    return this.prisma.vote.findMany({
      where: { electionId },
      select: { positionId: true, candidateId: true },
    });
  }

  /**
   * INSERT-only: records a ballot's votes. The unique (memberId, positionId)
   * constraint plus the DB trigger (votes_immutability.sql) enforce exactly one
   * immutable vote per member per position.
   */
  castVotes(
    votes: {
      memberId: string;
      electionId: string;
      positionId: string;
      candidateId: string;
    }[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.vote.createMany({ data: votes });
  }
}
