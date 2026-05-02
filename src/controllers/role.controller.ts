import { inject } from "inversify";
import {
  controller,
  httpDelete,
  httpGet,
  httpPost,
  httpPut,
  request,
  response,
} from "inversify-express-utils";
import { TYPES } from "../types";
import { Request, Response } from "express";
import { AuthMiddle } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import z from "zod";
import {
  created,
  deleted,
  ok,
  paginated,
  updated,
} from "../util/api-response.util";
import { RoleService } from "../services/role.service";
import { createRoleSchema, updateRoleSchema } from "../schema/role.schema";

@controller("/role")
export class RoleController {
  constructor(
    @inject(TYPES.RoleService)
    private service: RoleService,
  ) {}

    @httpGet("/get/simple")
    public async getRolesSimple(@request() req: Request, @response() res: Response) {
      const user = res.locals.user;
      const query = req.query;

      const { list, total, limit, page, forView } =
        await this.service.getRolesSimple(query);

      if (!forView) {
        return ok(res, list);
      }

      return paginated(res, list, { page, limit, total });
    }

  @httpGet("/get")
  public async getRoles(@request() req: Request, @response() res: Response) {
    const query = req.query;

    const { list, total, limit, page } = await this.service.getRoles(query);

    return paginated(res, list, { page, limit, total });
  }

  @httpGet("/get/:id")
  public async getRolesById(
    @request() req: Request,
    @response() res: Response,
  ) {
    const result = await this.service.getRolesById(req.params.id, req.query);

    return ok(res, result);
  }

  @httpPost("/create", validate({ body: createRoleSchema }))
  public async createRole(@request() req: Request, @response() res: Response) {
    const user = res.locals.user;

    const dto = req.body as z.infer<typeof createRoleSchema>;

    const createdRole = await this.service.createRole(dto);

    return created(res, createdRole, "Role created successfully");
  }

  @httpPut("/update/:id", validate({ body: updateRoleSchema }))
  public async updateRole(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;
    const params = req.params;
    const body = req.body as z.infer<typeof updateRoleSchema>;

    const updatedCategory = await this.service.updateRole(params.id, body);

    return updated(res, updatedCategory);
  }

  //   @httpDelete("/delete/:id")
  //   public async deleteCategory(
  //     @request() req: Request,
  //     @response() res: Response,
  //   ) {
  //     const user = res.locals.user;
  //     const params = req.params;

  //     await this.service.deleteCategory(params.id);

  //     return deleted(res);
  //   }
}
