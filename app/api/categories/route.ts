import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const categories = await sql`
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
    `

    return NextResponse.json({
      success: true,
      categories,
    })
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 })
  }
}
