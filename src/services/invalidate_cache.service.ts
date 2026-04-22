// import { inject, injectable } from "inversify";
// import { TYPES } from "../types";
// import { ProductRepo } from "../repositories/product.repo";
// import { notFound } from "../errors/http.error";
// import z from "zod";
// import { CacheService } from "./cache.service";
// import { CACHE_KEYS } from "../constants/cache.keys";
// import { createProductSchema, updateProductSchema } from "../schema/product.schema";

// @injectable()
// export class InvalidateCacheService {
//     constructor(
//         @inject(TYPES.CacheService)
//         private cache: CacheService,
//     ) { }

//     public async invalidateCache(params: any) {

//         switch (params.type) {
//             case "product":
//                 await this.cache.incr(CACHE_KEYS.PRODUCT_LIST_VERSION);
//                 break;
//             case "shop":
//                 await this.cache.incr(CACHE_KEYS.SHOP_LIST_VERSION);
//                 break;
//             default:
//                 break;
//         }
//     }
// }
