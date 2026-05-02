import { inject } from "inversify";
import {
  controller,
  httpGet,
  request,
  response,
} from "inversify-express-utils";
import { TYPES } from "../types";
import { Request, Response } from "express";
import { ok, paginated } from "../util/api-response.util";
import { PermissionService } from "../services/permission.service";

@controller("/permission")
export class PermissionController {
  constructor(
    @inject(TYPES.PermissionService)
    private service: PermissionService,
  ) {}

  @httpGet("/get")
  public async getPermissions(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;
    const query = req.query;

    const { list, total, limit, page, forView } =
      await this.service.getPermissions(query);

    console.log(forView);

    if (!forView) {
      return ok(res, list);
    }

    return paginated(res, list, { page, limit, total });
  }
}
