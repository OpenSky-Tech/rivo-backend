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
import { createBulkShopSchema, createShopSchema, updateShopSchema } from "../schema/shop.schema";
import z from "zod";
import { created, deleted, ok, paginated, updated } from "../util/api-response.util";
import { ShopService } from "../services/shop.service";

@controller("/shop")
export class ShopController {
    constructor(
        @inject(TYPES.ShopService)
        private service: ShopService,
    ) { }

    @httpGet("/get")
    public async getShop(@request() req: Request, @response() res: Response) {
        const user = res.locals.user;
        const query = req.query;

        const { list, total, limit, page } = await this.service.getShops(query);

        return paginated(res, list, { page, limit, total });
    }

    @httpGet("/get/:id")
    public async getShopById(@request() req: Request, @response() res: Response) {
        const user = res.locals.user;
        const params = req.params;

        const product = await this.service.getShopById(params.id);

        return ok(res, product);
    }

    @httpPost("/create", validate({ body: createShopSchema }))
    public async createShop(
        @request() req: Request,
        @response() res: Response,
    ) {
        const user = res.locals.user;

        const dto = req.body as z.infer<typeof createShopSchema>;

        const createdShop =  await this.service.createShop(dto);

        return created(res, createdShop, "Shop created successfully");
    }

    @httpPost("/create-bulk", validate({ body: createBulkShopSchema }))
    public async createBulkShop(
        @request() req: Request,
        @response() res: Response,
    ) {
        const user = res.locals.user;

        const dto = req.body as z.infer<typeof createBulkShopSchema>;

        await this.service.createBulkShop(dto.shops);

        return created(res, {}, "Shop created successfully");
    }

    // @httpPost("/invalidate-cache")

    @httpPut("/update/:id", validate({ body: updateShopSchema }))
    public async updateShop(@request() req: Request, @response() res: Response) {
        const user = res.locals.user;
        const params = req.params;
        const body = req.body as z.infer<typeof updateShopSchema>;

        const updatedShop = await this.service.updateShop(params.id, body);

        return updated(res, updatedShop);
    }

    @httpDelete("/delete/:id")
    public async deleteShop(@request() req: Request, @response() res: Response) {
        const user = res.locals.user;
        const params = req.params;

        await this.service.deleteShop(params.id);

        return deleted(res);
    }
}
