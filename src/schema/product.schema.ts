import { z } from "zod";
import { createVariantSchema } from "./variant.schema";

const productBaseSchema = z.object({
  shopid: z.string().uuid("Invalid shopId"),
  categoryid: z.string().uuid("Invalid categoryId").optional().nullable(),
  name: z.string().trim().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().trim().optional().nullable(),
  status: z.string().trim().max(100, "Status too long").optional().nullable(),
  isAvailableOnline: z.coerce.boolean().optional().nullable(),
  variants: z.array(createVariantSchema).default([]),
});

const validateVariants = (variants: any[], ctx: z.RefinementCtx) => {
  const seen = new Set<string>();

  variants.forEach((v, i) => {
    const sku = v.sku.trim().toLowerCase();

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

export const createProductSchema = productBaseSchema
  .strict()
  .superRefine((data, ctx) => validateVariants(data.variants, ctx));

export const updateProductSchema = productBaseSchema
  .partial()
  .strict()
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
