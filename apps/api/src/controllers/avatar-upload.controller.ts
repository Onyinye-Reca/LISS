import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import multer from "multer";
import { TYPES } from "../types";
import type { StorageService } from "../services/storage.service";
import { captureError } from "../instrument";

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
    try {
      // Run multer inside the handler so its errors (size/type) become 400s.
      await new Promise<void>((resolve, reject) =>
        upload(req, res, (err) => (err ? reject(err) : resolve())),
      );
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const url = await this.storage.uploadImage(req.file, "avatars");
      res.json({ url });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(400).json({ error: err.message });
      }
      captureError(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
}
