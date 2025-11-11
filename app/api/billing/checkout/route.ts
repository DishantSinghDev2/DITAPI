import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { paypalService } from "@/lib/paypal"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { subscriptionId } = await request.json()

    const db = await getDatabase()
    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    const subscription = await db.collection("subscriptions").findOne({
      _id: new ObjectId(subscriptionId),
      userId: user._id,
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    const plan = await db.collection("plans").findOne({
      _id: subscription.planId,
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    try {
      const billingPlan = (await paypalService.createBillingPlan(
        `${plan.name} - Monthly Subscription`,
        plan.price.toString(),
        "MONTH",
      )) as any

      if (!billingPlan.id) {
        throw new Error("Failed to create PayPal billing plan")
      }

      // Activate the billing plan
      await paypalService.activateBillingPlan(billingPlan.id)

      // Create billing agreement
      const agreement = (await paypalService.createBillingAgreement(billingPlan.id, new Date())) as any

      if (agreement.links) {
        const approvalLink = agreement.links.find((link: any) => link.rel === "approval_url")
        if (approvalLink) {
          return NextResponse.json({
            approvalUrl: approvalLink.href,
            token: agreement.token,
          })
        }
      }

      throw new Error("No approval URL found")
    } catch (paypalError) {
      console.error("PayPal error:", paypalError)
      return NextResponse.json({ error: "Failed to create payment plan" }, { status: 500 })
    }
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
