import { Kysely,PostgresDialect } from "kysely";
import { Pool } from "pg";
import dotenv from"dotenv"
import type { Database } from "../db/schema.js"
dotenv.config();


export const db = new Kysely<Database>({
    dialect:new PostgresDialect({
        pool:new Pool({
            host : process.env.DB_HOST,
            port : Number (process.env.DB_PORT),
            database : process.env.DB_NAME,
            user : process.env.DB_USER,
            password : process.env.DB_PASSWORD
        })
    })
})

