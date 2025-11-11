import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const subscriptionId = searchParams.get("subscription")
    const days = Number.parseInt(searchParams.get("days") || "30")

    const db = await getDatabase()

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const metrics = await db
      .collection("usage")
      .find({
        subscriptionId: new ObjectId(subscriptionId),
        date: { $gte: startDate },
      })
      .sort({ date: 1 })
      .toArray()

    // Calculate totals
    const totals = {
      totalRequests: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      statusCodes: {} as Record<number, number>,
    }

    metrics.forEach((metric) => {
      totals.totalRequests += metric.requestCount
      totals.avgResponseTime = (totals.avgResponseTime + metric.avgResponseTime) / 2

      Object.entries(metric.statusCodes).forEach(([status, count]) => {
        const statusCode = Number.parseInt(status)
        totals.statusCodes[statusCode] = (totals.statusCodes[statusCode] || 0) + count
        if (statusCode >= 400) {
          totals.totalErrors += count
        }
      })
    })

    return NextResponse.json({
      metrics,
      totals,
    })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
