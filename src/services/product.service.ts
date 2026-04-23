import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ProductRepo } from "../repositories/product.repo";
import { notFound } from "../errors/http.error";
import z from "zod";
// import { CacheService } from "./cache.service";
import { CACHE_KEYS } from "../constants/cache.keys";
import {
  createProductSchema,
  updateProductSchema,
} from "../schema/product.schema";

@injectable()
export class ProductService {
  constructor(
    @inject(TYPES.ProductRepo)
    private repo: ProductRepo,
    // @inject(TYPES.CacheService)
    // private cache: CacheService,
  ) {}

  public async getProducts(query: any) {
    const limit = Number(query.limit) || 5;
    const page = Number(query.page) || 1;
    const offset = (page - 1) * limit;

    const search = (query.search || "").trim();

    const shopid = query.shopid;

    const categoryid = query.categoryid;

    // const { limit: _l, offset: _o, search: _s, page: _p, ...rawAttrs } = query;

    // const attrs = Object.fromEntries(
    //   Object.entries(rawAttrs).map(([key, value]) => [key, this.normalizaAttrValue(value)])
    // );

    // let version = await this.cache.getString(CACHE_KEYS.PRODUCT_LIST_VERSION);

    // if (!version) {
    //   await this.cache.setJson(CACHE_KEYS.PRODUCT_LIST_VERSION, 1, 60 * 60);
    //   version = "1";
    // }

    // const cacheKey = CACHE_KEYS.productList(limit, page, search, version);

    // const cached = await this.cache.getJson<any>(cacheKey);

    // if (cached) {
    //   // For Testing console for redis about
    //   //   await this.cache.logCacheStats(cacheKey, version);
    //   return cached;
    // }

    const { list, total } = await this.repo.getProducts({
      limit,
      offset,
      search,
      shopid,
      categoryid,
    });

    const response = { list, limit, page, total: Number(total) };

    // await this.cache.setJson(cacheKey, response, 60 * 60);

    return response;
  }

  public async getProductById(id: any) {
    // const cacheKey = CACHE_KEYS.productDetail(id);

    // const cached = await this.cache.getJson<any>(cacheKey);

    // if (cached) {
    //   // await this.cache.logCacheStats(cacheKey);
    //   return cached;
    // }

    const product = await this.repo.getProductById(id);

    if (!product) {
      throw notFound("Product not found");
    }

    // await this.cache.setJson(cacheKey, product, 60 * 60);

    return product;
  }

  public async createProduct(body: z.infer<typeof createProductSchema>) {
    const { id } = await this.repo.createProduct(body);

    const createdProduct = await this.repo.getProductById(id);

    // await this.cache.incr(CACHE_KEYS.PRODUCT_LIST_VERSION);
    return createdProduct;
  }

  public async createBulkProduct(
    products: z.infer<typeof createProductSchema>[],
  ) {
    for (const product of products) {
      await this.repo.createProduct(product);
    }

    // await this.cache.incr(CACHE_KEYS.PRODUCT_LIST_VERSION)
  }

  public async updateProduct(
    id: any,
    body: z.infer<typeof updateProductSchema>,
  ) {
    const exists = await this.repo.getProductById(id);

    if (!exists) {
      throw notFound("Product not found");
    }

    await this.repo.updateProduct(id, body);

    const updatedProduct = await this.repo.getProductById(id);

    // await this.cache.delete(CACHE_KEYS.productDetail(id));
    // await this.cache.incr(CACHE_KEYS.PRODUCT_LIST_VERSION);

    return updatedProduct;
  }

  public async deleteProduct(id: any) {
    const exists = await this.repo.getProductById(id);

    if (!exists) {
      throw notFound("Product not found");
    }

    await this.repo.deleteProduct(id);

    // await this.cache.delete(CACHE_KEYS.productDetail(id));
    // await this.cache.incr(CACHE_KEYS.PRODUCT_LIST_VERSION);
  }

  public async invalidateCache() {
    // await this.cache.incr(CACHE_KEYS.PRODUCT_LIST_VERSION);
  }

  private normalizaAttrValue(value: any) {
    if (typeof value !== "string") return value;

    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);

    return value;
  }
}
