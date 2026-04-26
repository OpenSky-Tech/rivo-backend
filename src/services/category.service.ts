import { inject, injectable } from "inversify";
import { TYPES } from "../types";
// import { CacheService } from "./cache.service";
import { CACHE_KEYS } from "../constants/cache.keys";
import { badRequest, notFound } from "../errors/http.error";
import z from "zod";
import { CategoryRepo } from "../repositories/category.repo";
import { createCategorySchema, updateCategorySchema } from "../schema/category.schema";

@injectable()
export class CategoryService {
    constructor(
        @inject(TYPES.CategoryRepo)
        private repo: CategoryRepo,
        // @inject(TYPES.CacheService)
        // private cache: CacheService,
    ) { }

    public async getCategories(query: any) {
        const limit = Number(query.limit) || 5;
        const page = Number(query.page) || 1;
        const offset = (page - 1) * limit;

        const name = (query.name || "").trim();

        const shopid = (query.shopid);

        // let version = await this.cache.getString(CACHE_KEYS.SHOP_LIST_VERSION);

        // if (!version) {
        //     await this.cache.setJson(CACHE_KEYS.SHOP_LIST_VERSION, 1, 60 * 60);
        //     version = "1";
        // }

        // const cacheKey = CACHE_KEYS.shopList(limit, page, search, version);

        // const cached = await this.cache.getJson<any>(cacheKey);

        // if (cached) {
        //     return cached;
        // }

        const { list, total } = await this.repo.getCategories({ limit, offset, name, shopid });

        const response = { list, limit, page, total: Number(total) };

        // await this.cache.setJson(cacheKey, response, 60 * 60);

        return response;
    }

    public async getCategoryById(id: any) {
        // const cacheKey = CACHE_KEYS.shopDetail(id);

        // const cached = await this.cache.getJson<any>(cacheKey);

        // if (cached) {
        //     return cached;
        // }

        const shop = await this.repo.getCategoryById(id);

        if (!shop) {
            throw notFound("Category not found");
        }

        // await this.cache.setJson(cacheKey, shop, 60 * 60);

        return shop;
    }

    public async createCategory(body: z.infer<typeof createCategorySchema>) {

        const create = await this.repo.createCategory(body);

        // await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION);

        return create;

    }

    public async createBulkCategory(shops: z.infer<typeof createCategorySchema>[]) {

        for (const shop of shops) {
            await this.repo.createCategory(shop);
        }

        // await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION)
    }

    public async updateCategory(id: any, body: z.infer<typeof updateCategorySchema>) {
        const exists = await this.repo.getCategoryById(id);

        if (!exists) {
            throw notFound("Category not found");
        }

        await this.repo.updateCategory(id, body);

        const updated = await this.repo.getCategoryById(id);

        // await this.cache.delete(CACHE_KEYS.shopDetail(id));
        // await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION);

        return updated;
    }

    public async deleteCategory(id: any) {
        const exists = await this.repo.getCategoryById(id);

        if (!exists) {
            throw notFound("Category not found");
        }

        const inUse = await this.repo.shopInUse(id);

        if (inUse) {
            throw badRequest("Category is in use");
        }

        await this.repo.deleteCategory(id);

        // await this.cache.delete(CACHE_KEYS.shopDetail(id));
        // await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION);
    }

}