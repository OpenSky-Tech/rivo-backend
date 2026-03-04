import { ApiError } from "./api.error";

export const badRequest = (message: string, details?: unknown) =>
  new ApiError({ code: 400, type: "BAD_REQUEST", message, details });

export const validationError = (message: string, details?: unknown) =>
  new ApiError({ code: 400, type: "VALIDATION_ERROR", message, details });

export const unauthorized = (message = "Unauthorized") =>
  new ApiError({ code: 401, type: "UNAUTHORIZED", message });

export const forbidden = (message = "Forbidden") =>
  new ApiError({ code: 403, type: "FORBIDDEN", message });

export const notFound = (message = "Not found") =>
  new ApiError({ code: 404, type: "NOT_FOUND", message });

export const conflict = (message = "Conflict", details?: unknown) =>
  new ApiError({ code: 409, type: "CONFLICT", message, details });

export const tooManyRequest = (message = "Too many requests") =>
  new ApiError({ code: 429, type: "TOO_MANY_REQUESTS", message });

export const internalError = (
  message = "Internal server error",
  details?: unknown,
) => new ApiError({ code: 500, type: "INTERNAL_ERROR", message, details });
