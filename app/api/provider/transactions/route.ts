import { auth } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "provider")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || "all"

    const query: any = { providerId: session.user.id }

    if (search) {
      query.$or = [{ description: { $regex: search, $options: "i" } }, { reference: { $regex: search, $options: "i" } }]
    }

    if (type !== "all") {
      query.type = type
    }

    const transactions = await db
      .collection("providerTransactions")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    const totals = await db
      .collection("providerTransactions")
      .aggregate([
        { $match: { providerId: session.user.id } },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $cond: [{ $eq: ["$type", "subscription"] }, "$amount", 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } },
            paid: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] } },
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      transactions,
      totals: totals[0] || { revenue: 0, pending: 0, paid: 0 },
    })
  } catch (error) {
    console.error("Error fetching provider transactions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
