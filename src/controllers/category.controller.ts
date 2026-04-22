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
import { ProductService } from "../services/product.service";
import { Request, Response } from "express";
import { AuthMiddle } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createBulkShopSchema,
  createShopSchema,
  updateShopSchema,
} from "../schema/shop.schema";
import z from "zod";
import {
  created,
  deleted,
  ok,
  paginated,
  updated,
} from "../util/api-response.util";
import { CategoryService } from "../services/category.service";
import { createBulkCategorySchema, createCategorySchema, updateCategorySchema } from "../schema/category.schema";

@controller("/category")
export class CategoryController {
  constructor(
    @inject(TYPES.CategoryService)
    private service: CategoryService,
  ) {}

  @httpGet("/get")
  public async getCategory(@request() req: Request, @response() res: Response) {
    const user = res.locals.user;
    const query = req.query;

    const { list, total, limit, page } = await this.service.getCategories(query);

    return paginated(res, list, { page, limit, total });
  }

  @httpGet("/get/:id")
  public async getCategoryById(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;
    const params = req.params;

    const product = await this.service.getCategoryById(params.id);

    return ok(res, product);
  }

  @httpPost("/create", validate({ body: createCategorySchema }))
  public async createCategory(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;

    const dto = req.body as z.infer<typeof createCategorySchema>;

    const createdShop = await this.service.createCategory(dto);

    return created(res, createdShop, "Category created successfully");
  }

  @httpPost("/create-bulk", validate({ body: createBulkCategorySchema }))
  public async createBulkCategory(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;

    const dto = req.body as z.infer<typeof createBulkCategorySchema>;

    await this.service.createBulkCategory(dto.categories);

    return created(res, {}, "Categories created successfully");
  }

  // @httpPost("/invalidate-cache")

  @httpPut("/update/:id", validate({ body: updateCategorySchema }))
  public async updateCategory(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;
    const params = req.params;
    const body = req.body as z.infer<typeof updateCategorySchema>;

    const updatedCategory = await this.service.updateCategory(params.id, body);

    return updated(res, updatedCategory);
  }

  @httpDelete("/delete/:id")
  public async deleteCategory(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;
    const params = req.params;

    await this.service.deleteCategory(params.id);

    return deleted(res);
  }
}
