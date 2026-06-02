import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Validates and replaces req.body with the parsed result.
 * Part of the input-sanitisation defence in PRD 7.2.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}
