import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ShopRepo } from "../repositories/shop.repo";
// import { CacheService } from "./cache.service";
import { CACHE_KEYS } from "../constants/cache.keys";
import { badRequest, notFound } from "../errors/http.error";
import z from "zod";
import { createShopSchema, updateShopSchema } from "../schema/shop.schema";

@injectable()
export class ShopService {
  constructor(
    @inject(TYPES.ShopRepo)
    private repo: ShopRepo,
    // @inject(TYPES.CacheService)
    // private cache: CacheService,
  ) {}

  public async getShops(query: any) {
    const limit = Number(query.limit) || 5;
    const page = Number(query.page) || 1;
    const offset = (page - 1) * limit;

    const name = (query.name || "").trim();

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

    const { list, total } = await this.repo.getShops({ limit, offset, name });

    const response = { list, limit, page, total: Number(total) };

    // await this.cache.setJson(cacheKey, response, 60 * 60);

    return response;
  }

  public async getShopById(id: any) {
    // const cacheKey = CACHE_KEYS.shopDetail(id);

    // const cached = await this.cache.getJson<any>(cacheKey);

    // if (cached) {
    //     return cached;
    // }

    const shop = await this.repo.getShopById(id);

    if (!shop) {
      throw notFound("Shop not found");
    }

    // await this.cache.setJson(cacheKey, shop, 60 * 60);

    return shop;
  }

  public async createShop(body: z.infer<typeof createShopSchema>) {
    const create = await this.repo.createShop(body);

    // await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION);

    return create;
  }

  public async createBulkShop(shops: z.infer<typeof createShopSchema>[]) {
    for (const shop of shops) {
      await this.repo.createShop(shop);
    }

    // await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION)
  }

  public async updateShop(id: any, body: z.infer<typeof updateShopSchema>) {
    const exists = await this.repo.getShopById(id);

    if (!exists) {
      throw notFound("Shop not found");
    }

    await this.repo.updateShop(id, body);

    const updatedShop = await this.repo.getShopById(id);

    // await this.cache.delete(CACHE_KEYS.shopDetail(id));
    // await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION);

    return updatedShop;
  }

  public async deleteShop(id: any) {
    const exists = await this.repo.getShopById(id);

    if (!exists) {
      throw notFound("Shop not found");
    }

    const inUse = await this.repo.shopInUse(id);

    if (inUse) {
      throw badRequest("Shop is in use");
    }

    await this.repo.deleteShop(id);

    // await this.cache.delete(CACHE_KEYS.shopDetail(id));
    // await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION);
  }
}
