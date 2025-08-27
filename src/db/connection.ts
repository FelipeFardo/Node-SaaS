import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.ts";
import * as schema from "./schema/index.ts";

export * from "./schema";

export const sql = postgres(env.DATABASE_URL);
export const db = drizzle(sql, {
	schema,
	casing: "snake_case",
});
