// import { injectable } from "inversify";
// import { getRedisClient } from "../config/redis";

// export interface CacheService {
//     getJson<T>(key: string): Promise<T | null>;
//     setJson(key: string, value: any, ttl?: number): Promise<void>;
//     delete(key: string): Promise<void>;
//     incr(key: string): Promise<number>;
//     getString(key: string): Promise<string | null>;
//     logCacheStats(key: string, version?: string): Promise<void>;
// }

// @injectable()
// export class CacheService implements CacheService {

//     async getJson<T>(key: string): Promise<T | null> {
//         const redis = await getRedisClient();
//         const raw = (await redis.get(key)) as string | null;
//         if (!raw) return null;
//         return JSON.parse(raw) as T;
//     }

//     async setJson(key: string, value: any, ttl?: number): Promise<void> {
//         const redis = await getRedisClient();
//         const raw = JSON.stringify(value);
//         if (ttl) {
//             await redis.set(key, raw, { EX: ttl });
//         } else {
//             await redis.set(key, raw);
//         }
//     }

//     async delete(key: string): Promise<void> {
//         const redis = await getRedisClient();
//         await redis.del(key);
//     }

//     async incr(key: string): Promise<number> {
//         const redis = await getRedisClient();
//         return await redis.incr(key);
//     }

//     async getString(key: string): Promise<string | null> {
//         const redis = await getRedisClient();
//         return (await redis.get(key)) as string | null;
//     }

//     async logCacheStats(key: string, version?: string): Promise<void> {
//         const redis = await getRedisClient();
//         const res = {
//             key,
//             version: version ?? "N/A",
//             exists: await redis.exists(key),
//             ttl: await redis.ttl(key),
//             // get: await redis.get(key),
//             type: await redis.type(key),
//             del: await redis.del(key),
//             total: await redis.dbSize()
//         }
//         console.log("res = ", res);
//     }
// }