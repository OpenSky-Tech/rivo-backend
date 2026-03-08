import type { ErrorRequestHandler, Response } from "express";
import { success, ZodError } from "zod";
import { ApiError } from "../errors/api.error";
import { internalError } from "../errors/http.error";
import { toIssueList } from "../util/validation-error.util";

function sendApiError(res: Response, err: ApiError) {
  return res.status(err.code).json({
    code: err.code,
    success: false,
    error: {
      type: err.type,
      message: err.expose ? err.message : "Internal server error",
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

function isPgError(err: any) {
  return typeof err?.code === "string" && typeof err?.message === "string";
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // 1. If headers are already sent, delegate to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // 2. Custom App errors
  if (err instanceof ApiError) {
    return sendApiError(res, err);
  }

  // 3. Handle Malformed JSON (thrown by express.json() body parser)
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      code: 400,
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
      code: 400,
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: toIssueList("body", err.issues),
      },
    });
  }

  if (isPgError(err)) {
    if (err.code === "23505") {
      return res.status(409).json({
        code: 409,
        success: false,
        error: {
          type: "CONFLICT",
          message: "Duplicate value",
          detials: {
            constraint: err.constraint,
            detial: err.detail,
          },
        },
      });
    }

    if (err.code === "23503") {
      return res.status(400).json({
        code: 400,
        success: false,
        error: {
          type: "BAD_REQUEST",
          message: "Referenced record does not exist",
          details: {
            constraint: err.constraint,
            detail: err.detail,
          },
        },
      });
    }

    // not-null violation
    if (err.code === "23502") {
      return res.status(400).json({
        code: 400,
        success: false,
        error: {
          type: "BAD_REQUEST",
          message: "Required database field is missing",
          details: {
            column: err.column,
            detail: err.detail,
          },
        },
      });
    }

    // invalid text representation
    if (err.code === "22P02") {
      return res.status(400).json({
        code: 400,
        success: false,
        error: {
          type: "BAD_REQUEST",
          message: "Invalid input format",
          details: {
            detail: err.detail,
          },
        },
      });
    }

    // check constraint violation
    if (err.code === "23514") {
      return res.status(400).json({
        code: 400,
        success: false,
        error: {
          type: "BAD_REQUEST",
          message: "Database check constraint failed",
          details: {
            constraint: err.constraint,
            detail: err.detail,
          },
        },
      });
    }
  }

  // 6. Unknown errors. Add more context to logs.
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  const appError = internalError("Internal server error");
  return sendApiError(res, appError);
};
