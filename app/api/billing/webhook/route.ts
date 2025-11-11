import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = await getDatabase()

    const eventType = body.event_type

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        // Subscription activated
        await db.collection("subscriptions").updateOne(
          { "metadata.paypalToken": body.resource.token },
          {
            $set: {
              status: "active",
              "metadata.paypalAgreementId": body.resource.agreement_id,
              updatedAt: new Date(),
            },
          },
        )
        break

      case "BILLING.SUBSCRIPTION.PAYMENT.SUCCESS":
        // Payment successful
        const subscription = await db.collection("subscriptions").findOne({
          "metadata.paypalAgreementId": body.resource.agreement_id,
        })

        if (subscription) {
          // Create or update invoice
          await db.collection("invoices").updateOne(
            { subscriptionId: subscription._id, status: "pending" },
            {
              $set: {
                status: "paid",
                paypalTransactionId: body.resource.id,
                paidDate: new Date(),
                updatedAt: new Date(),
              },
            },
          )

          // Update subscription renewal date
          const renewalDate = new Date()
          renewalDate.setMonth(renewalDate.getMonth() + 1)

          await db.collection("subscriptions").updateOne(
            { _id: subscription._id },
            {
              $set: {
                renewalDate,
                updatedAt: new Date(),
              },
            },
          )
        }
        break

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        // Payment failed
        await db.collection("subscriptions").updateOne(
          { "metadata.paypalAgreementId": body.resource.agreement_id },
          {
            $set: {
              status: "suspended",
              updatedAt: new Date(),
            },
          },
        )
        break

      case "BILLING.SUBSCRIPTION.CANCELLED":
        // Subscription cancelled
        await db.collection("subscriptions").updateOne(
          { "metadata.paypalAgreementId": body.resource.agreement_id },
          {
            $set: {
              status: "cancelled",
              cancelledAt: new Date(),
              updatedAt: new Date(),
            },
          },
        )
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
