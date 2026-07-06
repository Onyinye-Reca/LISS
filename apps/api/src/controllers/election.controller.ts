import { Response } from "express";
import rateLimit from "express-rate-limit";
import multer, { MulterError } from "multer";
import {
  controller,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
} from "inversify-express-utils";
import { inject } from "inversify";
import {
  ElectionCreateSchema,
  ElectionUpdateSchema,
  PositionCreateSchema,
  CandidateCreateSchema,
  VoteSchema,
  ElectionSummary,
  ElectionDetail,
  ELECTION_ROLES,
} from "@liss11/shared";
import { Prisma } from "@prisma/client";
import { TYPES } from "../types";
import {
  ElectionRepository,
  ElectionWithBallot,
  ElectionWithCount,
} from "../repositories/election.repository";
import { ElectionService, ElectionError } from "../services/election.service";
import type { StorageService } from "../services/storage.service";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { captureError } from "../instrument";

function toSummary(e: ElectionWithCount, hasVoted: boolean): ElectionSummary {
  return {
    id: e.id,
    title: e.title,
    isOpen: e.isOpen,
    resultsPublished: e.resultsPublished,
    opensAt: e.opensAt ? e.opensAt.toISOString() : null,
    closesAt: e.closesAt ? e.closesAt.toISOString() : null,
    positionCount: e._count.positions,
    hasVoted,
  };
}

function toDetail(e: ElectionWithBallot, hasVoted: boolean): ElectionDetail {
  return {
    id: e.id,
    title: e.title,
    isOpen: e.isOpen,
    resultsPublished: e.resultsPublished,
    opensAt: e.opensAt ? e.opensAt.toISOString() : null,
    closesAt: e.closesAt ? e.closesAt.toISOString() : null,
    positions: e.positions.map((p) => ({
      id: p.id,
      title: p.title,
      candidates: p.candidates.map((c) => ({
        id: c.id,
        name: c.name,
        manifesto: c.manifesto,
        photoUrl: c.photoUrl,
      })),
    })),
    hasVoted,
  };
}

const manageGuards = [requireAuth, requireRole(...ELECTION_ROLES)] as const;

// Curb vote spam (PRD 7.2). Per-IP; a member votes once per election anyway.
const voteLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true });

// Candidate photo upload (images only, 5 MB).
const candidatePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG, or WebP images are allowed")),
}).single("file");

const code = (err: unknown) => (err as { code?: string }).code;

@controller("/elections")
export class ElectionController {
  constructor(
    @inject(TYPES.ElectionRepository) private repo: ElectionRepository,
    @inject(TYPES.ElectionService) private service: ElectionService,
    @inject(TYPES.StorageService) private storage: StorageService,
  ) {}

  // EC-scoped candidate photo upload (keeps the committee isolated from the
  // general /admin/uploads content endpoint, PRD 4.11).
  @httpPost("/candidate-photo", ...manageGuards)
  async candidatePhoto(req: AuthedRequest, res: Response) {
    try {
      await new Promise<void>((resolve, reject) =>
        candidatePhotoUpload(req as never, res, (err) => (err ? reject(err) : resolve())),
      );
    } catch (err) {
      const status = err instanceof MulterError && err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ error: err instanceof Error ? err.message : "Invalid upload" });
    }
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) return res.status(400).json({ error: "No file provided" });
    try {
      const url = await this.storage.uploadImage(file, "candidates");
      res.json({ url });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }

  // --- Reads (any logged-in member) ---

  @httpGet("/", requireAuth)
  async list(req: AuthedRequest, res: Response) {
    const [elections, voted] = await Promise.all([
      this.repo.list(),
      this.repo.memberVotedElectionIds(req.auth!.memberId),
    ]);
    res.json({ elections: elections.map((e) => toSummary(e, voted.has(e.id))) });
  }

  @httpGet("/:id", requireAuth)
  async detail(req: AuthedRequest, res: Response) {
    const election = await this.repo.findById(req.params.id);
    if (!election) return res.status(404).json({ error: "Election not found" });
    const voted = await this.repo.votedPositionIds(req.auth!.memberId, election.id);
    res.json({ election: toDetail(election, voted.size > 0) });
  }

  @httpGet("/:id/results", requireAuth)
  async results(req: AuthedRequest, res: Response) {
    try {
      const canSeeLive = ELECTION_ROLES.includes(req.auth!.role);
      const results = await this.service.getResults(req.params.id, canSeeLive);
      res.json({ results });
    } catch (err) {
      if (err instanceof ElectionError) {
        return res.status(err.status).json({ error: err.message });
      }
      captureError(err);
      res.status(500).json({ error: "Could not load results" });
    }
  }

  // Full audit trail as CSV (Electoral Committee / admin only, PRD 4.11).
  @httpGet("/:id/audit.csv", ...manageGuards)
  async audit(req: AuthedRequest, res: Response) {
    try {
      const csv = await this.service.auditCsv(req.params.id);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="election-${req.params.id}-audit.csv"`,
      );
      res.send(csv);
    } catch (err) {
      if (err instanceof ElectionError) {
        return res.status(err.status).json({ error: err.message });
      }
      captureError(err);
      res.status(500).json({ error: "Could not export audit log" });
    }
  }

  // --- Voting (any logged-in member) ---

  @httpPost("/:id/vote", voteLimiter, requireAuth, validateBody(VoteSchema))
  async vote(req: AuthedRequest, res: Response) {
    try {
      await this.service.castBallot(req.auth!.memberId, req.params.id, req.body, req.ip ?? null);
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof ElectionError) {
        return res.status(err.status).json({ error: err.message });
      }
      if (code(err) === "P2002") {
        return res.status(409).json({ error: "You have already voted in this election" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not record your vote" });
    }
  }

  // --- Management (Electoral Committee + admins) ---

  @httpPost("/", ...manageGuards, validateBody(ElectionCreateSchema))
  async create(req: AuthedRequest, res: Response) {
    try {
      const b = req.body;
      const created = await this.repo.create({
        title: b.title,
        opensAt: b.opensAt ? new Date(b.opensAt) : null,
        closesAt: b.closesAt ? new Date(b.closesAt) : null,
      });
      const full = await this.repo.findById(created.id);
      res.status(201).json({ election: toDetail(full!, false) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not create election" });
    }
  }

  @httpPut("/:id", ...manageGuards, validateBody(ElectionUpdateSchema))
  async update(req: AuthedRequest, res: Response) {
    try {
      const b = req.body;
      // Opening voting requires a complete, votable ballot: at least one
      // position, each with at least one candidate.
      if (b.isOpen === true) {
        const current = await this.repo.findById(req.params.id);
        if (!current) return res.status(404).json({ error: "Election not found" });
        if (
          current.positions.length === 0 ||
          current.positions.some((p) => p.candidates.length === 0)
        ) {
          return res.status(400).json({
            error: "Every position needs at least one candidate before you can open voting.",
          });
        }
      }
      const data: Prisma.ElectionUncheckedUpdateInput = {};
      if (b.title !== undefined) data.title = b.title;
      if (b.isOpen !== undefined) data.isOpen = b.isOpen;
      if (b.resultsPublished !== undefined) data.resultsPublished = b.resultsPublished;
      if (b.opensAt !== undefined) data.opensAt = b.opensAt ? new Date(b.opensAt) : null;
      if (b.closesAt !== undefined) data.closesAt = b.closesAt ? new Date(b.closesAt) : null;
      await this.repo.update(req.params.id, data);
      const full = await this.repo.findById(req.params.id);
      if (!full) return res.status(404).json({ error: "Election not found" });
      const voted = await this.repo.votedPositionIds(req.auth!.memberId, full.id);
      res.json({ election: toDetail(full, voted.size > 0) });
    } catch (err) {
      if (code(err) === "P2025") return res.status(404).json({ error: "Election not found" });
      captureError(err);
      res.status(500).json({ error: "Could not update election" });
    }
  }

  @httpDelete("/:id", ...manageGuards)
  async remove(req: AuthedRequest, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if (code(err) === "P2025") return res.status(404).json({ error: "Election not found" });
      if (code(err) === "P2003") {
        return res.status(409).json({ error: "Cannot delete an election that has votes" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete election" });
    }
  }

  @httpPost("/:id/positions", ...manageGuards, validateBody(PositionCreateSchema))
  async addPosition(req: AuthedRequest, res: Response) {
    try {
      // Pre-check existence (correct 404 instead of a Prisma FK 500) and block
      // structural changes while voting is open.
      const election = await this.repo.findById(req.params.id);
      if (!election) return res.status(404).json({ error: "Election not found" });
      if (election.isOpen) {
        return res.status(409).json({ error: "Close voting before changing positions" });
      }
      await this.repo.createPosition(election.id, req.body.title);
      const full = await this.repo.findById(election.id);
      res.status(201).json({ election: toDetail(full!, false) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not add position" });
    }
  }

  @httpDelete("/positions/:positionId", ...manageGuards)
  async removePosition(req: AuthedRequest, res: Response) {
    try {
      const open = await this.repo.positionOpenState(req.params.positionId);
      if (open === null) return res.status(404).json({ error: "Position not found" });
      if (open) return res.status(409).json({ error: "Close voting before changing positions" });
      await this.repo.deletePosition(req.params.positionId);
      res.json({ ok: true });
    } catch (err) {
      if (code(err) === "P2003") {
        return res.status(409).json({ error: "Cannot delete a position that has votes" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete position" });
    }
  }

  @httpPost("/positions/:positionId/candidates", ...manageGuards, validateBody(CandidateCreateSchema))
  async addCandidate(req: AuthedRequest, res: Response) {
    try {
      const open = await this.repo.positionOpenState(req.params.positionId);
      if (open === null) return res.status(404).json({ error: "Position not found" });
      if (open) return res.status(409).json({ error: "Close voting before changing candidates" });
      await this.repo.createCandidate(req.params.positionId, {
        name: req.body.name,
        manifesto: req.body.manifesto ?? null,
        photoUrl: req.body.photoUrl ?? null,
      });
      res.status(201).json({ ok: true });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not add candidate" });
    }
  }

  @httpDelete("/candidates/:candidateId", ...manageGuards)
  async removeCandidate(req: AuthedRequest, res: Response) {
    try {
      const open = await this.repo.candidateOpenState(req.params.candidateId);
      if (open === null) return res.status(404).json({ error: "Candidate not found" });
      if (open) return res.status(409).json({ error: "Close voting before changing candidates" });
      await this.repo.deleteCandidate(req.params.candidateId);
      res.json({ ok: true });
    } catch (err) {
      if (code(err) === "P2003") {
        return res.status(409).json({ error: "Cannot delete a candidate that has votes" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete candidate" });
    }
  }
}
