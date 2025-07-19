import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool)

// Export pool for raw SQL queries if needed
export { pool }
