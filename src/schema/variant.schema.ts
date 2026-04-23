import { z } from "zod";

const attrKeySchema = z
  .string()
  .trim()
  .min(1, "Attr key is required")
  .max(50, "Attr key too long");

const attrValueSchema = z.union([
  z.string().trim(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const attrsSchema = z.record(attrKeySchema, attrValueSchema);

export const createVariantSchema = z
  .object({
    sku: z.string().trim().min(1, "SKU is required").max(50, "SKU too long"),
    barcode: z.string().trim().optional().nullable(),
    stock: z.coerce.number().int().nonnegative().default(0),
    price: z.coerce.number().nonnegative(),
    attrs: attrsSchema.default({}),
  })
  .strict();
