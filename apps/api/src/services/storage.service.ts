import { injectable } from "inversify";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export interface StorageService {
  /** Uploads an image and returns its public URL. */
  uploadImage(file: UploadedFile, folder: string): Promise<string>;
}

/** Real uploads via Cloudinary (PRD §8). Reads CLOUDINARY_URL from the env. */
@injectable()
export class CloudinaryStorageService implements StorageService {
  uploadImage(file: UploadedFile, folder: string): Promise<string> {
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
}

/**
 * Local-disk fallback used when CLOUDINARY_URL is not set, so dev/CI need no
 * account. Files are written under apps/api/uploads and served statically.
 */
@injectable()
export class LocalStorageService implements StorageService {
  private readonly dir = join(process.cwd(), "uploads");

  async uploadImage(file: UploadedFile, folder: string): Promise<string> {
    const sub = join(this.dir, folder);
    await mkdir(sub, { recursive: true });
    const name = `${randomUUID()}${extname(file.originalname) || ".img"}`;
    await writeFile(join(sub, name), file.buffer);
    const base = process.env.API_BASE_URL ?? "http://localhost:4000";
    return `${base}/uploads/${folder}/${name}`;
  }
}
