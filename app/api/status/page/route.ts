import { getDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const db = await getDatabase()

    const [status, components, incidents] = await Promise.all([
      db.collection("system_status").findOne({}),
      db.collection("status_components").find({}).toArray(),
      db.collection("incidents").find({}).sort({ createdAt: -1 }).limit(10).toArray(),
    ])

    // Calculate uptime from usage data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const usage = await db
      .collection("usage")
      .find({ date: { $gte: thirtyDaysAgo } })
      .toArray()

    const totalRequests = usage.reduce((sum, u) => sum + u.requestCount, 0)
    const failedRequests = usage.reduce(
      (sum, u) =>
        sum +
        Object.entries(u.statusCodes)
          .filter(([code]) => Number.parseInt(code) >= 500)
          .reduce((s, [_, count]) => s + (count as number), 0),
      0,
    )

    const uptime = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests) * 100 : 99.99

    return NextResponse.json({
      status: status?.status || "operational",
      uptime: Number.parseFloat(uptime.toFixed(2)),
      components,
      incidents,
      lastUpdated: status?.lastUpdated || new Date(),
    })
  } catch (error) {
    console.error("[v0] Status page error:", error)
    return NextResponse.json({
      status: "degraded",
      error: "Failed to fetch status",
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (token !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const { status, components } = await req.json()

    await db.collection("system_status").updateOne(
      {},
      {
        $set: {
          status,
          components,
          lastUpdated: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
