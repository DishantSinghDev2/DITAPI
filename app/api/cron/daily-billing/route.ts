import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { billingQueue } from "@/lib/queue"

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const subscriptionsToRenew = await db
      .collection("subscriptions")
      .find({
        renewalDate: {
          $gte: today,
          $lt: tomorrow,
        },
        status: "active",
      })
      .toArray()

    // Enqueue billing jobs for all subscriptions due for renewal
    const jobs = await Promise.all(
      subscriptionsToRenew.map((subscription) =>
        billingQueue.add(
          { subscriptionId: subscription._id.toString() },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
          },
        ),
      ),
    )

    return NextResponse.json({
      message: `Enqueued ${jobs.length} billing jobs`,
      count: jobs.length,
    })
  } catch (error) {
    console.error("Cron error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
