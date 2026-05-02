import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { PermissionRepo } from "../repositories/permission.repo";

@injectable()
export class PermissionService {
  constructor(
    @inject(TYPES.PermissionRepo)
    private repo: PermissionRepo,
  ) {}

  public async getPermissions(query: any) {
    const forView = query.forView === true;

    const limit = Number(query.limit) || 5;
    const page = Number(query.page) || 1;
    const offset = (page - 1) * limit;

    const name = (query.name || "").trim();

    const { list, total } = await this.repo.getPermissions({
      limit,
      offset,
      name,
      forView
    });

    const response = { list, limit, page, total: Number(total), forView };

    return response;
  }
}
