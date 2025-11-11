import { auth } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const searchParams = request.nextUrl.searchParams
    const period = Number.parseInt(searchParams.get("period") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    const [totalUsers, activeAPIs, totalRequests, topProviders, revenueTrend, requestTrend] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("apis").countDocuments({ status: "published" }),
      db.collection("apiLogs").countDocuments({ timestamp: { $gte: startDate } }),
      db
        .collection("users")
        .aggregate([
          { $match: { role: "provider" } },
          {
            $lookup: {
              from: "apis",
              localField: "_id",
              foreignField: "organizationId",
              as: "apis",
            },
          },
          {
            $project: {
              name: 1,
              apiCount: { $size: "$apis" },
              subscriberCount: 100,
              revenue: 5000,
            },
          },
          { $limit: 5 },
        ])
        .toArray(),
      db
        .collection("invoices")
        .aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              status: "completed",
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      db
        .collection("apiLogs")
        .aggregate([
          {
            $match: {
              timestamp: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
              requests: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ])

    const platformRevenue = revenueTrend.reduce((sum, r) => sum + r.revenue, 0)

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeAPIs,
        totalRequests,
        platformRevenue,
      },
      topProviders,
      revenueTrend: revenueTrend.map((r) => ({
        date: r._id,
        revenue: r.revenue,
      })),
      requestTrend: requestTrend.map((r) => ({
        date: r._id,
        requests: r.requests,
      })),
    })
  } catch (error) {
    console.error("Error fetching admin dashboard:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
