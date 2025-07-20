import { NextResponse } from "next/server"
import { getSession } from "@/app/session"
import { cancelSubscriptionInDb } from "@/lib/database/dashboard-queries"
import { getSubscriptionById } from "@/lib/subscription/subscription-queries"

export async function DELETE(request: Request, { params }: { params: { subscriptionId: string } }) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subscriptionId } = params

  try {
    const subscription = await getSubscriptionById(subscriptionId)

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Ensure the user owns the subscription or is an admin
    if (subscription.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedSubscription = await cancelSubscriptionInDb(subscriptionId)

    if (updatedSubscription) {
      return NextResponse.json(
        { success: true, message: "Subscription cancelled successfully.", subscription: updatedSubscription },
        { status: 200 },
      )
    } else {
      return NextResponse.json({ success: false, message: "Failed to cancel subscription." }, { status: 500 })
    }
  } catch (error) {
    console.error("Error cancelling subscription:", error)
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 })
  }
}
