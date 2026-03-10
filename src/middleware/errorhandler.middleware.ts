import type { ErrorRequestHandler, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors/api.error";
import { internalError } from "../errors/http.error";
import { toIssueList } from "../util/validation-error.util";
import { table } from "node:console";

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

type PgLikeError = Error & {
  code?: string;
  detail?: string;
  constraint?: string;
  column?: string;
  table?: string;
  schema?: string;
  where?: string;
};

function isPgError(err: unknown): err is PgLikeError {
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as PgLikeError).code === "string" &&
    (err as PgLikeError).code!.length === 5 &&
    typeof (err as Error).message === "string"
  );
}

function isRedisError(err: unknown): err is Error {
  return err instanceof Error &&
    /redis|socket|ecconn|enotfound|timeout|auth|allowlist|url/i.test(err.message);
}

function handlePgError(res: Response, err: PgLikeError) {
  // unique_violation
  if (err.code === "23505") {
    return res.status(409).json({
      code: 409,
      success: false,
      error: {
        type: "CONFLICT",
        message: "Duplicate value",
        details: {
          constraint: err.constraint,
          detail: err.detail,
        },
      },
    });
  }

  // foreign_key_violation
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

  // not_null_violation
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

  // invalid_text_representation
  if (err.code === "22P02") {
    return res.status(400).json({
      code: 400,
      success: false,
      error: {
        type: "BAD_REQUEST",
        message: "Invalid input format",
        details: {
          detail: err.detail ?? err.message,
        },
      },
    });
  }

  // check_violation
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

  // string_data_right_truncation
  if (err.code === "22001") {
    return res.status(400).json({
      code: 400,
      success: false,
      error: {
        type: "BAD_REQUEST",
        message: "Input value is too long",
        details: {
          detail: err.detail ?? err.message,
        },
      },
    });
  }

  // numeric_value_out_of_range
  if (err.code === "22003") {
    return res.status(400).json({
      code: 400,
      success: false,
      error: {
        type: "BAD_REQUEST",
        message: "Numeric value is out of range",
        details: {
          detail: err.detail ?? err.message,
        },
      },
    });
  }

  // invalid_datetime_format
  if (err.code === "22007") {
    return res.status(400).json({
      code: 400,
      success: false,
      error: {
        type: "BAD_REQUEST",
        message: "Invalid date/time format",
        details: {
          detail: err.detail ?? err.message,
        },
      },
    });
  }

  // fallback for all other postgres errors
  return res.status(500).json({
    code: 500,
    success: false,
    error: {
      type: "DATABASE_ERROR",
      message: "Unexpected database error",
      details: {
        code: err.code,
        detail: err.detail ?? err.message,
      },
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
        message: "Request validation failed",
        details: toIssueList("body", err.issues),
      },
    });
  }

  if (isRedisError(err)) {
    return res.status(500).json({
      code: 500,
      success: false,
      error: {
        type: "REDIS_ERROR",
        message: "Unexpected redis error",
        details: {
          detail: err.message,
        },
      },
    });
  }

  if (isPgError(err)) {
    return handlePgError(res, err);
  }

  // 6. Unknown errors. Add more context to logs.
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  const appError = internalError("Internal server error");
  return sendApiError(res, appError);
};
