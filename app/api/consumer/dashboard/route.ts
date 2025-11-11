import { NextResponse } from "next/server"

export async function GET() {
  try {
    const usageChart = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      requests: Math.floor(Math.random() * 50000),
      errors: Math.floor(Math.random() * 100),
    }))

    const latencyChart = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      p95: Math.floor(Math.random() * 200) + 50,
      p99: Math.floor(Math.random() * 300) + 100,
    }))

    return NextResponse.json({
      spending: {
        today: 25000,
        month: 450000,
        total: 2000000,
      },
      usage: {
        requests: 1234567,
        p95Latency: 125,
        errorRate: 0.25,
      },
      subscriptions: {
        active: 8,
        expiringSoon: 2,
      },
      usageChart,
      latencyChart,
      topApis: [
        { name: "Payment API", calls: 450000, latency: 85 },
        { name: "Weather Service", calls: 320000, latency: 120 },
        { name: "ML Services", calls: 280000, latency: 450 },
        { name: "Analytics", calls: 185000, latency: 95 },
      ],
    })
  } catch (error) {
    console.error("Error in consumer dashboard:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 })
  }
}
