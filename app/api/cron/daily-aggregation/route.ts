import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { usageAggregationQueue } from "@/lib/queue"

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()

    const subscriptions = await db.collection("subscriptions").find({ status: "active" }).toArray()

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // Enqueue usage aggregation jobs
    const jobs = await Promise.all(
      subscriptions.map((subscription) =>
        usageAggregationQueue.add(
          {
            subscriptionId: subscription._id.toString(),
            date: yesterday.toISOString(),
          },
          {
            attempts: 2,
            backoff: { type: "exponential", delay: 1000 },
          },
        ),
      ),
    )

    return NextResponse.json({
      message: `Enqueued ${jobs.length} aggregation jobs`,
      count: jobs.length,
    })
  } catch (error) {
    console.error("Cron error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
