import { auth } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "provider")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const searchParams = request.nextUrl.searchParams
    const apiId = searchParams.get("api")
    const days = Number.parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const trend = await db
      .collection("invoices")
      .aggregate([
        {
          $match: {
            "api._id": new ObjectId(apiId),
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
      .toArray()

    const planBreakdown = await db
      .collection("subscriptions")
      .aggregate([
        {
          $match: {
            apiId: new ObjectId(apiId),
            status: "active",
          },
        },
        {
          $lookup: {
            from: "plans",
            localField: "planId",
            foreignField: "_id",
            as: "plan",
          },
        },
        { $unwind: "$plan" },
        {
          $group: {
            _id: "$plan.name",
            subscribers: { $sum: 1 },
            revenue: { $sum: "$plan.price" },
          },
        },
      ])
      .toArray()

    const plans = await db
      .collection("plans")
      .aggregate([
        { $match: { apiId: new ObjectId(apiId) } },
        {
          $lookup: {
            from: "subscriptions",
            let: { planId: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$planId", "$$planId"] }, status: "active" } }],
            as: "subscriptions",
          },
        },
        {
          $project: {
            name: 1,
            price: 1,
            subscribers: { $size: "$subscriptions" },
            totalRevenue: { $multiply: ["$price", { $size: "$subscriptions" }] },
            mrr: { $multiply: ["$price", { $size: "$subscriptions" }] },
          },
        },
      ])
      .toArray()

    const totals = await db
      .collection("invoices")
      .aggregate([
        {
          $match: {
            "api._id": new ObjectId(apiId),
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
          },
        },
      ])
      .toArray()

    const activeSubscriptions = await db.collection("subscriptions").countDocuments({
      apiId: new ObjectId(apiId),
      status: "active",
    })

    return NextResponse.json({
      totals: {
        totalRevenue: totals[0]?.totalRevenue || 0,
        activeSubscriptions,
        avgPlanPrice: plans.length > 0 ? plans.reduce((sum, p) => sum + p.price, 0) / plans.length : 0,
        churnRate: 2.5,
      },
      trend: trend.map((t) => ({
        date: t._id,
        revenue: t.revenue,
      })),
      planBreakdown: planBreakdown.map((p) => ({
        planName: p._id,
        subscribers: p.subscribers,
        revenue: p.revenue,
      })),
      plans,
    })
  } catch (error) {
    console.error("Error fetching provider revenue:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
