import { injectable } from "inversify";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

/**
 * How to deliver a private document to an already-authorized member:
 * either redirect to a short-lived signed URL (Cloudinary) or stream a local
 * file (dev fallback). The caller (controller) has already checked the session.
 */
export interface DocumentDelivery {
  redirectUrl?: string; // signed, time-limited remote URL
  localPath?: string; // absolute path to stream from disk
}

export interface StorageService {
  /** Uploads an image and returns its public URL. */
  uploadImage(file: UploadedFile, folder: string): Promise<string>;
  /** Uploads a private document and returns an opaque storage reference. */
  uploadDocument(file: UploadedFile, folder: string): Promise<string>;
  /** Resolves a stored reference into a way to deliver the file. */
  getDocument(ref: string, fileName: string): Promise<DocumentDelivery>;
}

/** Real uploads via Cloudinary (PRD §8). Reads CLOUDINARY_URL from the env. */
@injectable()
export class CloudinaryStorageService implements StorageService {
  // Lazy-require so the SDK parses CLOUDINARY_URL on first use (inside the
  // controller's try/catch) rather than at import time. A malformed URL then
  // fails the request with a clear error instead of crashing the whole app.
  private sdk() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return (require("cloudinary") as typeof import("cloudinary")).v2;
  }

  uploadImage(file: UploadedFile, folder: string): Promise<string> {
    const cloudinary = this.sdk();
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `liss11/${folder}`, resource_type: "image" },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("Cloudinary upload failed"));
          }
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }

  uploadDocument(file: UploadedFile, folder: string): Promise<string> {
    const cloudinary = this.sdk();
    return new Promise((resolve, reject) => {
      // `authenticated` keeps the asset private: it can only be delivered with
      // a valid signature, so the raw secure_url is not publicly usable.
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `liss11/${folder}`,
          resource_type: "raw",
          type: "authenticated",
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("Cloudinary upload failed"));
          }
          resolve(result.public_id);
        },
      );
      stream.end(file.buffer);
    });
  }

  async getDocument(ref: string, fileName: string): Promise<DocumentDelivery> {
    const cloudinary = this.sdk();
    const format = extname(fileName).replace(".", ""); // raw uses format separately
    // Signed, time-limited download URL (~10 min). Only handed to members the
    // controller has already authenticated.
    const redirectUrl = cloudinary.utils.private_download_url(ref, format, {
      resource_type: "raw",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 600,
    });
    return { redirectUrl };
  }
}

/**
 * Local-disk fallback used when CLOUDINARY_URL is not set, so dev/CI need no
 * account. Public images go under apps/api/uploads (served statically);
 * private documents go under apps/api/private-uploads (NOT served statically,
 * only via the session-gated download endpoint).
 */
@injectable()
export class LocalStorageService implements StorageService {
  private readonly publicDir = join(process.cwd(), "uploads");
  private readonly privateDir = join(process.cwd(), "private-uploads");

  async uploadImage(file: UploadedFile, folder: string): Promise<string> {
    const sub = join(this.publicDir, folder);
    await mkdir(sub, { recursive: true });
    const name = `${randomUUID()}${extname(file.originalname) || ".img"}`;
    await writeFile(join(sub, name), file.buffer);
    const base = process.env.API_BASE_URL ?? "http://localhost:4000";
    return `${base}/uploads/${folder}/${name}`;
  }

  async uploadDocument(file: UploadedFile, folder: string): Promise<string> {
    const sub = join(this.privateDir, folder);
    await mkdir(sub, { recursive: true });
    const name = `${randomUUID()}${extname(file.originalname) || ".bin"}`;
    await writeFile(join(sub, name), file.buffer);
    return `${folder}/${name}`; // relative ref under privateDir
  }

  async getDocument(ref: string): Promise<DocumentDelivery> {
    return { localPath: join(this.privateDir, ref) };
  }
}
