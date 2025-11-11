import { type NextRequest, NextResponse } from "next/server"
import { billingQueue } from "@/lib/queue"

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json()

    const job = await billingQueue.add(
      { subscriptionId },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
      },
    )

    return NextResponse.json({ jobId: job.id })
  } catch (error) {
    console.error("Job enqueue error:", error)
    return NextResponse.json({ error: "Failed to enqueue job" }, { status: 500 })
  }
}
