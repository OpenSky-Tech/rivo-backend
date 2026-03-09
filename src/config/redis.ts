import { RedisClientType, createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
    if (connecting) return connecting;
    if (client?.isReady) return client;

    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not defined");

    client = createClient({ url });

    client.on("error", (err) => {
        console.error("Redis error:", err);
    });

    connecting = client.connect()
        .then(() => {
            console.log("Redis connected");
            return client;
        })
        .finally(() => {
            connecting = null;
        })
        .catch((err) => {
            console.error("Redis connection error:", err);
            throw err;
        });
    return connecting;
}