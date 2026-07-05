import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import multer, { MulterError } from "multer";
import { TYPES } from "../types";
import type { StorageService } from "../services/storage.service";
import { captureError } from "../instrument";

/** Maps a multer/file-filter rejection to a 400 (413 for oversize). */
function uploadErrorStatus(err: unknown): number {
  return err instanceof MulterError && err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
}

// In-memory buffer -> storage; 5 MB cap; images only (JPG/PNG/WebP).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, or WebP images are allowed"));
    }
  },
}).single("file");

/**
 * PUBLIC avatar upload used during sign-up, when the member has no session yet.
 * (The admin content upload at /admin/uploads requires auth + a content role.)
 * Rate-limited in server.ts to curb anonymous abuse. Stores to the "avatars"
 * folder and returns the URL, which register() then persists.
 */
@controller("/uploads")
export class AvatarUploadController {
  constructor(@inject(TYPES.StorageService) private storage: StorageService) {}

  @httpPost("/avatar")
  async uploadAvatar(req: Request, res: Response) {
    // 1. Parse the upload. multer/file-filter errors are the user's fault (400).
    try {
      await new Promise<void>((resolve, reject) =>
        upload(req, res, (err) => (err ? reject(err) : resolve())),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid upload";
      return res.status(uploadErrorStatus(err)).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    // 2. Store it. Storage/provider failures are server errors (500, logged,
    //    generic message - never leak provider internals).
    try {
      const url = await this.storage.uploadImage(req.file, "avatars");
      res.json({ url });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
}
