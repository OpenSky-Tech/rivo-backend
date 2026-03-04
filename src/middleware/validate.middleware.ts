import { RequestHandler } from "express";
import { z } from "zod";
import { validationError } from "../errors/http.error";

type AsySchema<T = unknown> = z.ZodType<T>;

type ValidateSchema<B = unknown, Q = unknown, P = unknown> = {
  body?: AsySchema<B>;
  query?: AsySchema<Q>;
  params?: AsySchema<P>;
};

function toIssueList(part: "body" | "query" | "params", issues: z.ZodIssue[]) {
  return issues.map((i) => ({
    part,
    path: [part, ...i.path].join("."), // like -> body.productid, query.something
    message: i.message,
    code: i.code,
  }));
}

export function validate<B = unknown, Q = unknown, P = unknown>(
  schemas: ValidateSchema<B, Q, P>,
): RequestHandler {
  return (req, res, next) => {
    const allIssues: Array<{
      part: "body" | "query" | "params";
      path: string;
      message: string;
      code: string;
    }> = [];

    //body
    if (schemas.body) {
      const r = schemas.body.safeParse(req.body);
      if (!r.success) allIssues.push(...toIssueList("body", r.error.issues));
      else req.body = r.data;
    }

    //query
    if (schemas.query) {
      const r = schemas.query.safeParse(req.query);
      if (!r.success) allIssues.push(...toIssueList("query", r.error.issues));
      else req.query = r.data as any;
    }

    //params
    if (schemas.params) {
      const r = schemas.params.safeParse(req.params);
      if (!r.success) allIssues.push(...toIssueList("params", r.error.issues));
      else req.params = r.data as any;
    }

    if (allIssues.length > 0) {
      return next(validationError("Validation error", allIssues));
    }

    return next();
  };
}
