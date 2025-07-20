// @/lib/database/connection.ts
import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool)

// Health check utility
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1")
    return true
  } catch (err) {
    console.error("DB connection failed:", err)
    return false
  }
}

export { pool }
