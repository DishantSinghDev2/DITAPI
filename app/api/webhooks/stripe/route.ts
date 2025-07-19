import { NextResponse } from "next/server"
import Stripe from "stripe"
import {
  createSubscriptionInDb,
  updateSubscriptionStatusInDb,
  getSubscriptionByStripeId,
} from "@/lib/subscription/subscription-queries"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const checkoutSession = event.data.object as Stripe.CheckoutSession
      // Fulfill the purchase...
      console.log("Checkout session completed:", checkoutSession.id)
      // Retrieve custom metadata
      const userId = checkoutSession.metadata?.userId
      const apiId = checkoutSession.metadata?.apiId
      const planId = checkoutSession.metadata?.planId
      const stripeSubscriptionId = checkoutSession.subscription as string

      if (userId && apiId && planId && stripeSubscriptionId) {
        try {
          await createSubscriptionInDb(userId, apiId, planId, stripeSubscriptionId)
          console.log(`Subscription created for user ${userId} to API ${apiId} with plan ${planId}`)
        } catch (dbError) {
          console.error("Database error creating subscription:", dbError)
          return NextResponse.json({ error: "Database error" }, { status: 500 })
        }
      } else {
        console.warn("Missing metadata for checkout.session.completed event:", checkoutSession.metadata)
      }
      break
    case "customer.subscription.updated":
      const subscriptionUpdated = event.data.object as Stripe.Subscription
      console.log("Customer subscription updated:", subscriptionUpdated.id)
      // Handle subscription status changes (e.g., active, cancelled, past_due)
      try {
        const existingSubscription = await getSubscriptionByStripeId(subscriptionUpdated.id)
        if (existingSubscription) {
          let newStatus: "active" | "cancelled" | "expired" | "past_due" = "active"
          if (subscriptionUpdated.status === "canceled") {
            newStatus = "cancelled"
          } else if (subscriptionUpdated.status === "past_due") {
            newStatus = "past_due"
          } else if (subscriptionUpdated.status === "unpaid") {
            newStatus = "expired" // Or another appropriate status
          }

          await updateSubscriptionStatusInDb(existingSubscription.id, newStatus)
          console.log(`Subscription ${existingSubscription.id} status updated to ${newStatus}`)
        } else {
          console.warn(`Subscription with Stripe ID ${subscriptionUpdated.id} not found in DB.`)
        }
      } catch (dbError) {
        console.error("Database error updating subscription:", dbError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
      break
    case "customer.subscription.deleted":
      const subscriptionDeleted = event.data.object as Stripe.Subscription
      console.log("Customer subscription deleted:", subscriptionDeleted.id)
      // Handle subscription cancellation or end
      try {
        const existingSubscription = await getSubscriptionByStripeId(subscriptionDeleted.id)
        if (existingSubscription) {
          await updateSubscriptionStatusInDb(existingSubscription.id, "expired")
          console.log(`Subscription ${existingSubscription.id} marked as expired/deleted.`)
        } else {
          console.warn(`Subscription with Stripe ID ${subscriptionDeleted.id} not found in DB.`)
        }
      } catch (dbError) {
        console.error("Database error deleting subscription:", dbError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
      break
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true }, { status: 200 })
}
