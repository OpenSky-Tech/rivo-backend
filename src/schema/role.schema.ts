import { z } from "zod";

const roleBaseSchema = z.object({
  shopid: z.string().uuid("Invalid shopId").optional(),

  name: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .max(100, "Role name too long"),
  permissionids: z.array(z.string().uuid("Invalid permissionId")).default([]),
});

const validatePermissionIds = (
  permissionids: string[],
  ctx: z.RefinementCtx,
) => {
  const seen = new Set<string>();

  permissionids.forEach((permissionid, i) => {
    const id = permissionid.trim().toLowerCase();

    if (seen.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permissionids", i],
        message: "Duplicate permission id",
      });
    }

    seen.add(id);
  });
};

export const createRoleSchema = roleBaseSchema
  .strict()
  .superRefine((data, ctx) => {
    validatePermissionIds(data.permissionids, ctx);
  });

export const updateRoleSchema = roleBaseSchema
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    if (data.permissionids) {
      validatePermissionIds(data.permissionids, ctx);
    }
  });
