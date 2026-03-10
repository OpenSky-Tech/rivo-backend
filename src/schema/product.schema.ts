import { z } from "zod";
import { createVariantSchema } from "./variant.schema";

const productCoreObject = z.object({
  name: z.string().trim().min(1, "Name is required"),
  basePrice: z.coerce.number().nonnegative(),
  inactive: z.coerce.boolean().default(false),
  variants: z.array(createVariantSchema).default([]),
});

const validateVariants = (variants: any[], ctx: z.RefinementCtx) => {
  const seen = new Set<string>();

  variants.forEach((v, i) => {
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
};

export const createProductSchema = productCoreObject.superRefine((data, ctx) =>
  validateVariants(data.variants, ctx),
);

export const updateProductSchema = productCoreObject
  .partial()
  .superRefine((data, ctx) => {
    if (data.variants) {
      validateVariants(data.variants, ctx);
    }
  });

export const createBulkProductSchema = z.object({
  products: z
    .array(createProductSchema)
    .min(1, "Must provide at least 1 product"),
});
