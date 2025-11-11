import { auth } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"

    const query: any = { userId: session.user.id }

    if (search) {
      query.$or = [
        { "api.name": { $regex: search, $options: "i" } },
        { paypalTransactionId: { $regex: search, $options: "i" } },
      ]
    }

    if (status !== "all") {
      query.status = status
    }

    const transactions = await db
      .collection("invoices")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "subscriptions",
            localField: "subscriptionId",
            foreignField: "_id",
            as: "subscription",
          },
        },
        { $unwind: "$subscription" },
        {
          $lookup: {
            from: "apis",
            localField: "subscription.apiId",
            foreignField: "_id",
            as: "api",
          },
        },
        { $unwind: "$api" },
        {
          $lookup: {
            from: "plans",
            localField: "subscription.planId",
            foreignField: "_id",
            as: "plan",
          },
        },
        { $unwind: "$plan" },
        { $sort: { createdAt: -1 } },
        { $limit: 100 },
      ])
      .toArray()

    const totals = await db
      .collection("invoices")
      .aggregate([
        { $match: { ...query, status: "completed" } },
        {
          $group: {
            _id: null,
            spent: { $sum: "$amount" },
          },
        },
      ])
      .toArray()

    const subscriptions = await db
      .collection("subscriptions")
      .countDocuments({ userId: session.user.id, status: "active" })

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        ...t,
        api: t.api[0],
        plan: t.plan[0],
      })),
      totals: {
        spent: totals[0]?.spent || 0,
        subscriptions,
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
