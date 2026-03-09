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
import { createProductSchema } from "../schema/product.schema";
import z from "zod";
import { created, deleted, ok, paginated, updated } from "../util/api-response.util";

@controller("/product")
export class ProductController {
  constructor(
    @inject(TYPES.ProductService)
    private service: ProductService,
  ) { }

  @httpGet("/get")
  public async getProduct(@request() req: Request, @response() res: Response) {
    const user = res.locals.user;
    const query = req.query;

    const { list, total, limit, page } = await this.service.getProducts(query);

    return paginated(res, list, { page, limit, total });
  }

  @httpGet("/get/:id")
  public async getProductById(@request() req: Request, @response() res: Response) {
    const user = res.locals.user;
    const params = req.params;

    const product = await this.service.getProductById(params.id);

    return ok(res, product);
  }

  @httpPost("/create", validate({ body: createProductSchema }))
  public async createProduct(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;

    const dto = req.body as z.infer<typeof createProductSchema>;

    await this.service.createProduct(dto);

    return created(res, {}, "Product created successfully");
  }

  @httpPut("/update/:id")
  public async updateProduct(@request() req: Request, @response() res: Response) {
    const user = res.locals.user;
    const params = req.params;
    const body = req.body;

    const updatedProduct = await this.service.updateProduct(params.id, body);

    return updated(res, updatedProduct);
  }

  @httpDelete("/delete/:id")
  public async deleteProduct(@request() req: Request, @response() res: Response) {
    const user = res.locals.user;
    const params = req.params;

    await this.service.deleteProduct(params.id);

    return deleted(res);
  }
}
