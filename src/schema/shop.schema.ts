import { z } from "zod";

export const createShopSchema = z.object({
    ownerid: z.string().uuid("Invalid ownerid").optional().nullable(),
    name: z.string().trim().min(1, "Name is required").max(256),
    // address: z.string().trim().optional().nullable(),
    phone: z.string().trim().max(30, "Phone is too long").optional().nullable(),
    status: z.string().trim().max(256, "Status is too long").optional().nullable(),
});

export const updateShopSchema = createShopSchema.partial();

export const createBulkShopSchema = z.object({
    shops: z.array(createShopSchema).min(1, "Must provide at least 1 shop")
})
