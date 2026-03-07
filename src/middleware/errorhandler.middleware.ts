import type { ErrorRequestHandler, Response } from "express";
import { ZodError } from "zod";
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
        message: "Request Validation failed",
        details: toIssueList("body", err.issues),
      },
    });
  }

  // 6. Unknown errors. Add more context to logs.
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  const appError = internalError("Internal server error")
  return sendApiError(res, appError);
};
