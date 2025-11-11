import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const subscriptionId = new ObjectId(params.subscriptionId)

    const subscription = await db.collection("subscriptions").findOne({ _id: subscriptionId })
    if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Check ownership
    if (subscription.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const plan = await db.collection("plans").findOne({ _id: subscription.planId })
    const currentMonth = new Date()
    currentMonth.setDate(1)

    const monthlyUsage = await db.collection("usage").findOne({
      subscriptionId,
      date: { $gte: currentMonth },
    })

    const requestCount = monthlyUsage?.requestCount || 0
    const planLimit = plan?.requestsPerDay || 100
    const monthlyLimit = planLimit * 30
    const overage = Math.max(0, requestCount - monthlyLimit)

    // Calculate overage charge (e.g., $0.001 per request)
    const chargePerRequest = 0.001
    const totalOverageCharge = overage * chargePerRequest

    return NextResponse.json({
      planLimit: monthlyLimit,
      currentUsage: requestCount,
      overage,
      chargePerRequest,
      totalOverageCharge,
      estimatedNextBill: totalOverageCharge,
    })
  } catch (error) {
    console.error("[v0] Overage check error:", error)
    return NextResponse.json({ error: "Failed to check overage" }, { status: 500 })
  }
}
