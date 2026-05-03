import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import z from "zod";
import { RoleRepo } from "../repositories/role.repo";
import { createRoleSchema, updateRoleSchema } from "../schema/role.schema";
import { badRequest, notFound } from "../errors/http.error";

@injectable()
export class RoleService {
  constructor(
    @inject(TYPES.RoleRepo)
    private repo: RoleRepo,
  ) {}

  public async getRolesSimple(query: any) {
    const forView = query.forView === true;

    const limit = Number(query.limit) || 5;
    const page = Number(query.page) || 1;
    const offset = (page - 1) * limit;

    const name = (query.name || "").trim();

    const shopid = query.shopid;

    const { list, total } = await this.repo.getRolesSimple({
      limit,
      offset,
      name,
      shopid,
      forView,
    });

    const response = { list, limit, page, total: Number(total), forView };

    return response;
  }

  public async getRoles(query: any) {
    const limit = Number(query.limit) || 100;
    const page = Number(query.page) || 1;
    const offset = (page - 1) * limit;

    const name = (query.name || "").trim();
    const shopid = query.shopid;

    // if (!shopid) {
    //   throw new Error("shopid is required");
    // }

    const { list, total } = await this.repo.getRoles({
      limit,
      offset,
      name,
      shopid,
    });

    return {
      list,
      limit,
      page,
      total: Number(total),
    };
  }

  public async getRolesById(id: any, query: any) {
    if (!id) {
      throw badRequest("Role id is required");
    }

    const shopid = query.shopid;

    // if (!shopid) {
    //   throw badRequest("shopid is required");
    // }

    return await this.repo.getRoleById(id, shopid);
  }

  public async createRole(body: z.infer<typeof createRoleSchema>) {
    const { id } = await this.repo.createRole(body);

    const createdRole = await this.repo.getRoleById(id, body.shopid);

    return createdRole;
  }

  public async updateRole(id: any, body: z.infer<typeof updateRoleSchema>) {
    await this.repo.updateRole(id, body);

    const updated = await this.repo.getRoleById(id, body.shopid);

    return updated;
  }

  public async deleteRole(id: any, shopid: any) {
    if (!id) {
      throw badRequest("Role id is required");
    }

    if (!shopid) {
      throw badRequest("shopid is required");
    }

    const exists = await this.repo.getRoleById(id, shopid);

    if (!exists) {
      throw notFound("Role not found");
    }

    const inUse = await this.repo.roleCheckInShop(id, shopid);

    if (inUse) {
      throw badRequest("Role is in use");
    }

    await this.repo.deleteRole(id, shopid);
  }
}
