import { connectToDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    // Generate sample data for demonstration
    const revenueChart = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      revenue: Math.floor(Math.random() * 5000),
    }))

    const apiCallsChart = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      calls: Math.floor(Math.random() * 100000),
    }))

    return NextResponse.json({
      revenue: {
        today: 125000,
        month: 2500000,
        total: 15000000,
      },
      subscriptions: {
        active: 342,
        total: 487,
      },
      apiCalls: {
        today: 1234567,
        average: 987654,
      },
      topApis: [
        { name: "Weather API", calls: 450000 },
        { name: "Payment Gateway", calls: 320000 },
        { name: "ML Services", calls: 280000 },
        { name: "Data Analytics", calls: 185000 },
      ],
      revenueChart,
      apiCallsChart,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 })
  }
}
