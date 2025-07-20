import { NextResponse } from "next/server"
import { Pool } from "pg"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Initialize pool (only once per serverless function if caching is not implemented)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        category,
        provider_name,
        rating,
        total_requests,
        pricing_model,
        logo_url,
        slug
      FROM apis 
      WHERE status = 'active' AND featured = true
      ORDER BY rating DESC, total_requests DESC
      LIMIT 8
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Failed to fetch featured APIs:", error)
    return NextResponse.json([
      {
        id: "1",
        name: "Weather API",
        description: "Real-time weather data for any location worldwide",
        category: "Weather",
        provider_name: "WeatherCorp",
        rating: 4.8,
        total_requests: 1500000,
        pricing_model: "freemium",
        logo_url: "/placeholder.svg?height=40&width=40",
        slug: "weather-api",
      },
      {
        id: "2",
        name: "Payment Gateway",
        description: "Secure payment processing for e-commerce",
        category: "Finance",
        provider_name: "PayTech",
        rating: 4.9,
        total_requests: 2000000,
        pricing_model: "pay-per-use",
        logo_url: "/placeholder.svg?height=40&width=40",
        slug: "payment-gateway",
      },
      {
        id: "3",
        name: "SMS Service",
        description: "Send SMS messages globally with high delivery rates",
        category: "Communication",
        provider_name: "MessagePro",
        rating: 4.7,
        total_requests: 800000,
        pricing_model: "pay-per-use",
        logo_url: "/placeholder.svg?height=40&width=40",
        slug: "sms-service",
      },
      {
        id: "4",
        name: "Image Recognition",
        description: "AI-powered image analysis and object detection",
        category: "AI/ML",
        provider_name: "VisionAI",
        rating: 4.6,
        total_requests: 600000,
        pricing_model: "subscription",
        logo_url: "/placeholder.svg?height=40&width=40",
        slug: "image-recognition",
      },
    ])
  }
}
