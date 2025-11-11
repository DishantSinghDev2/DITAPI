import { getDatabase } from "@/lib/db"
import { sendEmail } from "@/lib/nodemailer"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const chargePerRequest = 0.001

    // Get all active subscriptions
    const subscriptions = await db.collection("subscriptions").find({ status: "active" }).toArray()

    let processed = 0
    let failed = 0

    for (const subscription of subscriptions) {
      try {
        const plan = await db.collection("plans").findOne({ _id: subscription.planId })
        const currentMonth = new Date()
        currentMonth.setDate(1)

        const monthlyUsage = await db.collection("usage").findOne({
          subscriptionId: subscription._id,
          date: { $gte: currentMonth },
        })

        const requestCount = monthlyUsage?.requestCount || 0
        const monthlyLimit = (plan?.requestsPerDay || 100) * 30
        const overage = Math.max(0, requestCount - monthlyLimit)

        if (overage > 0) {
          const totalCharge = overage * chargePerRequest

          // Check user credits
          const user = await db.collection("users").findOne({ _id: subscription.userId })
          const credits = await db.collection("credits").findOne({ userId: subscription.userId })
          const availableCredits = credits?.available || 0

          if (availableCredits >= totalCharge) {
            // Deduct from credits
            await db.collection("credits").updateOne(
              { userId: subscription.userId },
              {
                $inc: {
                  used: totalCharge,
                  available: -totalCharge,
                },
              },
            )

            // Log charge
            await db.collection("overage_charges").insertOne({
              subscriptionId: subscription._id,
              userId: subscription.userId,
              requests: overage,
              chargePerRequest,
              totalCharge,
              status: "paid",
              billingPeriod: {
                startDate: currentMonth,
                endDate: new Date(),
              },
              createdAt: new Date(),
            })

            // Send notification
            await sendEmail({
              to: user?.email!,
              subject: "DITAPI: Overage Charges Applied",
              html: `
                <h3>Overage Charges Applied</h3>
                <p>You have exceeded your plan limits for the current month.</p>
                <p><strong>Overage Requests:</strong> ${overage}</p>
                <p><strong>Charge:</strong> $${totalCharge.toFixed(2)}</p>
                <p><strong>Deducted from Credits:</strong> $${totalCharge.toFixed(2)}</p>
              `,
            })

            processed++
          } else {
            // Insufficient credits - create pending charge
            await db.collection("overage_charges").insertOne({
              subscriptionId: subscription._id,
              userId: subscription.userId,
              requests: overage,
              chargePerRequest,
              totalCharge,
              status: "pending",
              billingPeriod: {
                startDate: currentMonth,
                endDate: new Date(),
              },
              createdAt: new Date(),
            })

            // Send warning email
            await sendEmail({
              to: user?.email!,
              subject: "DITAPI: Overage Charges Pending",
              html: `
                <h3>Insufficient Credits for Overage Charges</h3>
                <p>You have exceeded your plan limits, but don't have enough credits.</p>
                <p><strong>Required Credits:</strong> $${totalCharge.toFixed(2)}</p>
                <p><strong>Available Credits:</strong> $${availableCredits.toFixed(2)}</p>
                <p><a href="https://api.dishis.tech/credits">Add credits now</a></p>
              `,
            })

            failed++
          }
        }
      } catch (error) {
        console.error("[v0] Overage processing error for subscription:", error)
      }
    }

    return NextResponse.json({ processed, failed })
  } catch (error) {
    console.error("[v0] Overage cron error:", error)
    return NextResponse.json({ error: "Failed to process overages" }, { status: 500 })
  }
}
