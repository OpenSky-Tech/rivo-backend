import { z } from "zod";
import { createVariantSchema } from "./variant.schema";

export const createProductSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    basePrice: z.coerce.number().nonnegative(),
    inactive: z.coerce.boolean().default(false),
    variants: z.array(createVariantSchema).default([]),
  })
  .strict()
  .superRefine((data, ctx) => {
    const seen = new Set<string>();

    data.variants.forEach((v, i) => {
      const sku = v.sku.toLowerCase();

      if (seen.has(sku)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", i, "sku"],
          message: "Duplicate sku in variants",
        });
      }
      seen.add(sku);
    });
  });
