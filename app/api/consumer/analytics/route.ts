import { auth } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const searchParams = request.nextUrl.searchParams
    const subscriptionId = searchParams.get("subscription")
    const days = Number.parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await db
      .collection("apiLogs")
      .aggregate([
        {
          $match: {
            subscriptionId,
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$date",
            requests: { $sum: 1 },
            errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
            totalResponseTime: { $sum: "$responseTime" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    const endpoints = await db
      .collection("apiLogs")
      .aggregate([
        {
          $match: {
            subscriptionId,
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$path",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ])
      .toArray()

    const totals = await db
      .collection("apiLogs")
      .aggregate([
        {
          $match: {
            subscriptionId,
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
            avgResponseTime: { $avg: "$responseTime" },
          },
        },
      ])
      .toArray()

    const total = totals[0] || { totalRequests: 0, errors: 0, avgResponseTime: 0 }

    return NextResponse.json({
      totals: {
        totalRequests: total.totalRequests,
        errors: total.errors,
        avgResponseTime: total.avgResponseTime,
        successRate: total.totalRequests > 0 ? ((total.totalRequests - total.errors) / total.totalRequests) * 100 : 100,
      },
      metrics: logs.map((log) => ({
        date: log._id,
        requests: log.requests,
        errors: log.errors,
        avgResponseTime: log.totalResponseTime / log.requests,
      })),
      endpoints: endpoints.map((ep) => ({
        path: ep._id,
        count: ep.count,
      })),
    })
  } catch (error) {
    console.error("Error fetching consumer analytics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
