import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "@/config";
import * as schema from "./schema";

const pool = new Pool({ connectionString: config.databaseUrl });
export const db = drizzle({ client: pool, schema });
export * from "./schema";
