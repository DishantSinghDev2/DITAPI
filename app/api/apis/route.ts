import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const apis = await sql`
      SELECT 
        a.id,
        a.name,
        a.slug,
        a.description,
        a.category_id,
        a.provider_id,
        a.base_url,
        a.documentation_url,
        a.logo_url,
        a.status,
        a.rating,
        a.total_requests,
        a.created_at,
        c.name as category_name,
        c.slug as category_slug,
        u.name as provider_name
      FROM apis a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.provider_id = u.id
      WHERE a.status = 'active'
      ORDER BY a.rating DESC, a.total_requests DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      apis,
    })
  } catch (error) {
    console.error("Failed to fetch APIs:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch APIs" }, { status: 500 })
  }
}
