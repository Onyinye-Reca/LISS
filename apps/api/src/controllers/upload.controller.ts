import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import multer from "multer";
import { CONTENT_ROLES } from "@liss11/shared";
import { TYPES } from "../types";
import type { StorageService } from "../services/storage.service";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

// In-memory so we can hand the buffer straight to Cloudinary; 5 MB cap;
// images only (PRD 4.6: JPG/PNG/WebP).
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

@controller("/admin/uploads")
export class UploadController {
  constructor(@inject(TYPES.StorageService) private storage: StorageService) {}

  @httpPost("/", requireAuth, requireRole(...CONTENT_ROLES))
  async uploadImage(req: Request, res: Response) {
    try {
      // Run multer inside the handler so its errors (size/type) become 400s.
      await new Promise<void>((resolve, reject) =>
        upload(req, res, (err) => (err ? reject(err) : resolve())),
      );
      if (!req.file) return res.status(400).json({ error: "No file provided" });

      const folder = typeof req.body.folder === "string" ? req.body.folder : "misc";
      const url = await this.storage.uploadImage(req.file, folder);
      res.json({ url });
    } catch (err) {
      // Validation-style errors (bad type/size) are the user's fault -> 400.
      if (err instanceof Error) {
        return res.status(400).json({ error: err.message });
      }
      captureError(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
}
