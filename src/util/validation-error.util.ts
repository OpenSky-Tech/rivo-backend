import { z } from "zod";

export type RequestPart = "body" | "query" | "params";

export type ValidationDetail = {
  location: RequestPart;
  field: string;
  message: string;
  rule: string;
};

function pathToField(path: PropertyKey[]): string {
  return path.length > 0 ? path.map(String).join(".") : "_root";
}

function humanizeField(field: any): string {
  if (field === "_root") return "Request";

  const lastPart = field.split(".").at(-1) ?? field;

  return lastPart
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatIssueMessage(field: string, issue: z.ZodIssue): string {
  const label = humanizeField(field);

  if (
    issue.code === z.ZodIssueCode.invalid_type &&
    issue.message.includes("received undefined")
  ) {
    return `${label} is required`;
  }

  if (
    issue.code === z.ZodIssueCode.invalid_type &&
    issue.message.includes("received NaN")
  ) {
    return `${label} is required`;
  }

  return issue.message;
}

export function toIssueList(
    location: RequestPart,
    issues: z.ZodIssue[]
): ValidationDetail[] {
    return issues.map((issue) => {
        const field = pathToField(issue.path);

        return {
            location,
            field,
            message: formatIssueMessage(field, issue),
            rule: issue.code
        }
    })
}
