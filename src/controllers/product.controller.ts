import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPost,
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

@controller("/product")
export class ProductController {
  constructor(
    @inject(TYPES.ProductService)
    private service: ProductService,
  ) {}

  @httpGet("/get")
  public async getProduct(@request() req: Request, @response() res: Response) {
    const user = res.locals.user;
    const params = req;

    const { list, count } = await this.service.getProducts(params);

    return res.status(200).json({
      returncode: "300",
      message: "Successful",
      list,
      count,
    });
  }

  @httpPost("/create", validate({ body: createProductSchema }))
  public async createProduct(
    @request() req: Request,
    @response() res: Response,
  ) {
    const user = res.locals.user;

    const dto = req.body as z.infer<typeof createProductSchema>;

    await this.service.createProduct(dto);

    return res.status(200).json({
      returncode: "300",
      message: "Successful",
    });
  }
}
