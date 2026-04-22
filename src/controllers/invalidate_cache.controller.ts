// import { inject } from "inversify";
// import {
//     controller,
//     httpPost,
//     request,
//     response,
// } from "inversify-express-utils";
// import { TYPES } from "../types";
// import { InvalidateCacheService } from "../services/invalidate_cache.service";
// import { Request, Response } from "express";
// import { ok } from "../util/api-response.util";

// @controller("/invalidate-cache")
// export class InvalidateCacheController {
//     constructor(
//         @inject(TYPES.InvalidateCacheService)
//         private service: InvalidateCacheService,
//     ) { }

//     @httpPost("/:type")
//     public async invalidateCache(@request() req: Request, @response() res: Response) {
//         const params = req.params;

//         await this.service.invalidateCache(params);

//         return ok(res, {}, "Cache invalidated successfully");
//     }

// }
