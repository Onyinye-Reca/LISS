import { inject, injectable } from "inversify";
import { VoteInput, ElectionResults, PositionResult } from "@liss11/shared";
import { TYPES } from "../types";
import { ElectionRepository } from "../repositories/election.repository";

/** Carries an HTTP status so the controller can map it directly. */
export class ElectionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "ElectionError";
  }
}

@injectable()
export class ElectionService {
  constructor(@inject(TYPES.ElectionRepository) private repo: ElectionRepository) {}

  /**
   * Casts a member's ballot: the election must be open, every selection must be
   * a real candidate for a real position, one selection per position, and the
   * member must not have already voted. Votes are INSERT-only and permanent.
   */
  async castBallot(
    memberId: string,
    electionId: string,
    input: VoteInput,
  ): Promise<void> {
    const election = await this.repo.findById(electionId);
    if (!election) throw new ElectionError("Election not found", 404);
    if (!election.isOpen) {
      throw new ElectionError("This election is not open for voting", 409);
    }

    // Valid candidate ids per position, for O(1) validation.
    const valid = new Map(
      election.positions.map((p) => [p.id, new Set(p.candidates.map((c) => c.id))]),
    );
    const seenPositions = new Set<string>();
    for (const sel of input.selections) {
      const candidates = valid.get(sel.positionId);
      if (!candidates) throw new ElectionError("Invalid position in ballot", 400);
      if (!candidates.has(sel.candidateId)) {
        throw new ElectionError("Invalid candidate for a position", 400);
      }
      if (seenPositions.has(sel.positionId)) {
        throw new ElectionError("Only one vote per position", 400);
      }
      seenPositions.add(sel.positionId);
    }

    // Require a complete ballot: one selection for every position. Partial
    // ballots would otherwise mark the member "voted" and hide the form,
    // locking them out of the remaining positions.
    if (seenPositions.size !== election.positions.length) {
      throw new ElectionError("Please vote for every position", 400);
    }

    const already = await this.repo.votedPositionIds(memberId, electionId);
    if (input.selections.some((s) => already.has(s.positionId))) {
      throw new ElectionError("You have already voted in this election", 409);
    }

    await this.repo.castVotes(
      input.selections.map((s) => ({
        memberId,
        electionId,
        positionId: s.positionId,
        candidateId: s.candidateId,
      })),
    );
  }

  /**
   * Tally per position + candidate. Live results are hidden from members while
   * voting is open (to avoid a bandwagon effect); the committee/admins can see
   * them anytime.
   */
  async getResults(electionId: string, canSeeLive: boolean): Promise<ElectionResults> {
    const election = await this.repo.findById(electionId);
    if (!election) throw new ElectionError("Election not found", 404);
    if (election.isOpen && !canSeeLive) {
      throw new ElectionError("Results are available once voting closes", 403);
    }

    const votes = await this.repo.electionVotes(electionId);
    const counts = new Map<string, number>();
    for (const v of votes) {
      const key = `${v.positionId}:${v.candidateId}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const positions: PositionResult[] = election.positions.map((p) => {
      const candidates = p.candidates
        .map((c) => ({
          candidateId: c.id,
          name: c.name,
          votes: counts.get(`${p.id}:${c.id}`) ?? 0,
        }))
        .sort((a, b) => b.votes - a.votes);
      return {
        positionId: p.id,
        title: p.title,
        totalVotes: candidates.reduce((sum, c) => sum + c.votes, 0),
        candidates,
      };
    });

    return {
      id: election.id,
      title: election.title,
      isOpen: election.isOpen,
      positions,
    };
  }
}
