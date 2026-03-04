export type ErrorTYPE =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  public readonly code: number;
  public readonly type: ErrorTYPE;
  public readonly details?: unknown;
  public readonly expose: boolean;
  constructor(args: {
    code: number;
    type: ErrorTYPE;
    message: string;
    details?: unknown;
    expose?: boolean;
  }) {
    super(args.message);
    this.code = args.code;
    this.type = args.type;
    this.details = args.details;
    this.expose = args.expose ?? true;
  }
}
