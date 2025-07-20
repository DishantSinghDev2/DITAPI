import { NextResponse } from "next/server"
import { Pool } from "pg"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        COUNT(a.id) as api_count
      FROM categories c
      LEFT JOIN apis a ON c.id = a.category_id AND a.status = 'active'
      GROUP BY c.id, c.name, c.slug, c.description
      ORDER BY c.name
    `)

    return NextResponse.json({
      success: true,
      categories: result.rows,
    })
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}
