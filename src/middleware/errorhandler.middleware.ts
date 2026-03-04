import type { ErrorRequestHandler } from "express";
import { ApiError } from "../errors/api.error";

function isPgError(err: any) {
  return typeof err?.code === "string" && typeof err?.message === "string";
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  //Custom errors
  if (err instanceof ApiError) {
    return res.status(err.code).json({
      success: false,
      error: {
        type: err.type,
        message: err.expose ? err.message : "Internal server error",
        ...(err.details
          ? {
              details: err.details,
            }
          : {}),
      },
    });
  }

  //Postgres errors
  if (isPgError(err)) {
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        error: {
          type: "BAD_REQUEST",
          message: "Duplicate value",
          details: {
            constraint: err.constraint,
            detail: err.detail,
          },
        },
      });
    }

    if (err.code === "22P02") {
      return res.status(400).json({
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
  }

  //Unknown errors
  console.error(err);
  return res.status(500).json({
    success: false,
    error: {
      type: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
};
