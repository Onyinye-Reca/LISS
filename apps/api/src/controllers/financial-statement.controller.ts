import { Response } from "express";
import { controller, httpGet, httpPost, httpPut, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import multer from "multer";
import {
  FinancialStatementCreateSchema,
  FinancialStatementUpdateSchema,
  FinancialStatementView,
  CONTENT_ROLES,
} from "@liss11/shared";
import { FinancialStatement, Prisma } from "@prisma/client";
import { TYPES } from "../types";
import { FinancialStatementRepository } from "../repositories/financial-statement.repository";
import type { StorageService } from "../services/storage.service";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

// PDFs only, up to 10 MB. In-memory so the buffer goes straight to storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
}).single("file");

function toView(s: FinancialStatement): FinancialStatementView {
  return {
    id: s.id,
    title: s.title,
    period: s.period,
    fileName: s.fileName,
    uploadedAt: s.uploadedAt.toISOString(),
  };
}

const writeGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

// Members-only (PRD financial transparency). The file itself is private; it is
// never exposed as a URL - members download via the session-gated /download.
@controller("/financials")
export class FinancialStatementController {
  constructor(
    @inject(TYPES.FinancialStatementRepository)
    private repo: FinancialStatementRepository,
    @inject(TYPES.StorageService) private storage: StorageService,
  ) {}

  @httpGet("/", requireAuth)
  async list(_req: unknown, res: Response) {
    const items = await this.repo.list();
    res.json({ statements: items.map(toView) });
  }

  // Session-gated download: only after auth do we mint a signed/streamed link.
  @httpGet("/:id/download", requireAuth)
  async download(req: { params: { id: string } }, res: Response) {
    try {
      const stmt = await this.repo.findById(req.params.id);
      if (!stmt) return res.status(404).json({ error: "Statement not found" });
      const name = stmt.fileName ?? "statement.pdf";
      const delivery = await this.storage.getDocument(stmt.fileRef, name);
      if (delivery.redirectUrl) return res.redirect(delivery.redirectUrl);
      if (delivery.localPath) return res.download(delivery.localPath, name);
      return res.status(500).json({ error: "File unavailable" });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not retrieve file" });
    }
  }

  @httpPost("/", ...writeGuards)
  async create(req: { body: Record<string, unknown>; file?: Express.Multer.File }, res: Response) {
    try {
      // Run multer in-handler so size/type errors become 400s (like uploads).
      await new Promise<void>((resolve, reject) =>
        upload(req as never, res, (err) => (err ? reject(err) : resolve())),
      );
      if (!req.file) return res.status(400).json({ error: "No file provided" });

      const parsed = FinancialStatementCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      }

      const fileRef = await this.storage.uploadDocument(req.file, "financials");
      const stmt = await this.repo.create({
        title: parsed.data.title,
        period: parsed.data.period ?? null,
        fileRef,
        fileName: req.file.originalname,
      });
      res.status(201).json({ statement: toView(stmt) });
    } catch (err) {
      if (err instanceof Error) return res.status(400).json({ error: err.message });
      captureError(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }

  @httpPut("/:id", ...writeGuards, validateBody(FinancialStatementUpdateSchema))
  async update(req: { params: { id: string }; body: { title?: string; period?: string | null } }, res: Response) {
    try {
      const data: Prisma.FinancialStatementUncheckedUpdateInput = {};
      if (req.body.title !== undefined) data.title = req.body.title;
      if (req.body.period !== undefined) data.period = req.body.period;
      const stmt = await this.repo.update(req.params.id, data);
      res.json({ statement: toView(stmt) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Statement not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update statement" });
    }
  }

  @httpDelete("/:id", ...writeGuards)
  async remove(req: { params: { id: string } }, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Statement not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete statement" });
    }
  }
}
