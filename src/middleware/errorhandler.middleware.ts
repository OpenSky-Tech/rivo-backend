import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors/api.error";

function isPgError(err: any): boolean {
  return typeof err?.code === "string" && typeof err?.message === "string";
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // 1. If headers are already sent, delegate to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // 2. Custom App errors
  if (err instanceof ApiError) {
    return res.status(err.code).json({
      success: false,
      error: {
        type: err.type,
        message: err.expose ? err.message : "Internal server error",
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // 3. Handle Malformed JSON (thrown by express.json() body parser)
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: {
        type: "BAD_REQUEST",
        message: "Malformed JSON payload",
      },
    });
  }

  // 4. Catch unexpected Zod Errors (if parsed outside of validate middleware)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "Validation error",
        details: err.issues,
      },
    });
  }

  // 5. Postgres DB errors
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isPgError(err)) {
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        error: {
          type: "CONFLICT", // Changed BAD_REQUEST to CONFLICT
          message: "Duplicate value",
          details: isDevelopment ? {
            constraint: err.constraint,
            detail: err.detail,
          } : undefined,
        },
      });
    }

    if (err.code === "22P02") {
      return res.status(400).json({
        success: false,
        error: {
          type: "BAD_REQUEST",
          message: "Invalid input format",
          details: isDevelopment ? {
            detail: err.detail,
          } : undefined,
        },
      });
    }
  }

  // 6. Unknown errors. Add more context to logs.
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  return res.status(500).json({
    success: false,
    error: {
      type: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
};
