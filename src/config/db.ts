import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import dotenv from "dotenv"
import type { Database } from "../db/schema.js"
dotenv.config();

export const db = new Kysely<Database>({
    dialect: new PostgresDialect({
        pool: new Pool({
            host: process.env.PG_HOST,
            port: Number(process.env.PG_PORT),
            database: process.env.PG_DATABASE,
            user: process.env.PG_USER,
            password: String(process.env.PG_PASSWORD || '')
        })
    })
})