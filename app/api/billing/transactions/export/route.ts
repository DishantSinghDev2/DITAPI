import { auth } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()

    const transactions = await db
      .collection("invoices")
      .aggregate([
        { $match: { userId: session.user.id } },
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
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    const csv = [
      "Date,API,Plan,Amount,Status,Transaction ID",
      ...transactions.map(
        (t) =>
          `${new Date(t.createdAt).toISOString()},${t.api?.[0]?.name || "N/A"},${t.subscription?.planName || "N/A"},${t.amount},${t.status},${t.paypalTransactionId || "N/A"}`,
      ),
    ].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting transactions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
