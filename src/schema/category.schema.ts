import { z } from "zod";

export const createCategorySchema = z.object({
  shopid: z.string().uuid("Invalid shopid"),
  parentid: z.string().uuid("Invalid parentid").optional().nullable(),
  name: z.string().trim().min(1, "Name is required").max(256),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createBulkCategorySchema = z.object({
  categories: z.array(createCategorySchema).min(1, "Must provide at least 1 category"),
});