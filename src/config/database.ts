import "dotenv/config";
import { Pool } from "pg";

export const pool = new Pool({
  // host: process.env.DB_HOST,
  // port: Number(process.env.DB_PORT || 5432),
  // database: process.env.DB_NAME,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// console.log("DB_HOST", process.env.DB_HOST);
// console.log("DB_USER", process.env.DB_USER);
// console.log("DB_PASSWORD type", typeof process.env.DB_PASSWORD);
// console.log("DB_PASSWORD exists", process.env.DB_PASSWORD ? "YES" : "NO");
