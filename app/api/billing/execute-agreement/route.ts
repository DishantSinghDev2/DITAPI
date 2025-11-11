import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { paypalService } from "@/lib/paypal"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { token, subscriptionId } = await request.json()

    const db = await getDatabase()

    try {
      const agreement = (await paypalService.executeBillingAgreement(token)) as any

      if (agreement.id) {
        // Update subscription with PayPal agreement ID
        await db.collection("subscriptions").updateOne(
          { _id: new ObjectId(subscriptionId) },
          {
            $set: {
              status: "active",
              "metadata.paypalAgreementId": agreement.id,
              "metadata.paypalToken": token,
              updatedAt: new Date(),
            },
          },
        )

        // Mark any pending invoices as paid
        await db.collection("invoices").updateMany(
          {
            subscriptionId: new ObjectId(subscriptionId),
            status: "pending",
          },
          {
            $set: {
              status: "paid",
              paypalTransactionId: agreement.id,
              paidDate: new Date(),
              updatedAt: new Date(),
            },
          },
        )

        return NextResponse.json({ success: true, agreementId: agreement.id })
      }

      throw new Error("No agreement ID returned")
    } catch (paypalError) {
      console.error("PayPal execution error:", paypalError)
      return NextResponse.json({ error: "Failed to execute agreement" }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
