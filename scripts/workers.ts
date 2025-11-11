import { billingQueue, usageAggregationQueue, payoutQueue, apisixSyncQueue, emailQueue } from "@/lib/queue"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { apisixService } from "@/lib/apisix"

billingQueue.process(async (job) => {
  const db = await getDatabase()
  const { subscriptionId } = job.data

  try {
    const subscription = await db.collection("subscriptions").findOne({
      _id: new ObjectId(subscriptionId),
    })

    if (!subscription || subscription.status !== "active") {
      return { skipped: true }
    }

    const plan = await db.collection("plans").findOne({
      _id: subscription.planId,
    })

    // Create invoice
    const invoiceResult = await db.collection("invoices").insertOne({
      subscriptionId: subscription._id,
      userId: subscription.userId,
      amount: plan.price,
      currency: "USD",
      status: "pending",
      description: `Subscription renewal`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invoiceNumber: `INV-${subscription._id}-${Date.now()}`,
      lineItems: [
        {
          description: plan.name,
          quantity: 1,
          unitPrice: plan.price,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log(`Invoice created: ${invoiceResult.insertedId}`)
    return { invoiceId: invoiceResult.insertedId }
  } catch (error) {
    console.error("Billing job error:", error)
    throw error
  }
})

usageAggregationQueue.process(async (job) => {
  const db = await getDatabase()
  const { subscriptionId, date } = job.data

  try {
    const subscription = await db.collection("subscriptions").findOne({
      _id: new ObjectId(subscriptionId),
    })

    const plan = await db.collection("plans").findOne({
      _id: subscription.planId,
    })

    const usage = await db.collection("usage").findOne({
      subscriptionId: new ObjectId(subscriptionId),
      date: new Date(date),
    })

    if (!usage) {
      return { skipped: true }
    }

    // Check if usage exceeds plan limits
    if (usage.requestCount > plan.requestsPerDay) {
      // Trigger overage notification or suspension
      await db.collection("subscriptions").updateOne(
        { _id: subscription._id },
        {
          $set: {
            status: "suspended",
            updatedAt: new Date(),
          },
        },
      )

      console.log(`Subscription ${subscriptionId} suspended due to usage limits`)
    }

    return { processed: true, requestCount: usage.requestCount }
  } catch (error) {
    console.error("Usage aggregation error:", error)
    throw error
  }
})

payoutQueue.process(async (job) => {
  const db = await getDatabase()
  const { organizationId, amount } = job.data

  try {
    const org = await db.collection("organizations").findOne({
      _id: new ObjectId(organizationId),
    })

    const owner = await db.collection("users").findOne({
      _id: org.ownerId,
    })

    // In production, integrate with actual payout service (Stripe Connect, PayPal Payouts, etc.)
    console.log(`Processing payout of $${amount} to ${owner.email}`)

    // Record payout in database
    await db.collection("payouts").insertOne({
      organizationId: org._id,
      amount,
      status: "processed",
      payoutDate: new Date(),
      createdAt: new Date(),
    })

    return { payoutProcessed: true, amount }
  } catch (error) {
    console.error("Payout job error:", error)
    throw error
  }
})

apisixSyncQueue.process(async (job) => {
  const db = await getDatabase()
  const { apiId, action } = job.data

  try {
    const api = await db.collection("apis").findOne({
      _id: new ObjectId(apiId),
    })

    if (!api) {
      return { skipped: true }
    }

    switch (action) {
      case "create":
      case "update":
        const routeId = `route-${api._id}`
        const upstreamId = `upstream-${api._id}`
        const url = new URL(api.baseUrl)

        await apisixService.createRoute(routeId, {
          uri: `/api/${api.slug}/*`,
          methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          upstream: {
            type: "roundrobin",
            nodes: {
              [`${url.hostname}:${url.port || 443}`]: 1,
            },
          },
          plugins: {
            "key-auth": {
              header: "X-API-Key",
              query: "api_key",
            },
            "limit-count": {
              count: api.rateLimit?.requestsPerMinute || 60,
              time_window: 60,
              rejected_code: 429,
            },
          },
        })
        console.log(`APISIX route ${action === "create" ? "created" : "updated"}: ${routeId}`)
        break

      case "delete":
        if (api.metadata?.apisixRouteId) {
          await apisixService.deleteRoute(api.metadata.apisixRouteId)
          console.log(`APISIX route deleted: ${api.metadata.apisixRouteId}`)
        }
        break
    }

    return { synced: true, action }
  } catch (error) {
    console.error("APISIX sync error:", error)
    throw error
  }
})

emailQueue.process(async (job) => {
  const { to, subject, template, data } = job.data

  try {
    // In production, use SendGrid, Mailgun, Resend, or similar service
    console.log(`Sending email to ${to}: ${subject}`)
    console.log(`Template: ${template}`, data)

    // This is a placeholder - integrate with your email service
    // Example with nodemailer or similar:
    // await transporter.sendMail({
    //   from: 'noreply@apimarketplace.com',
    //   to,
    //   subject,
    //   html: renderTemplate(template, data),
    // });

    return { sent: true, to, subject }
  } catch (error) {
    console.error("Email job error:", error)
    throw error
  }
})

console.log("Workers initialized and listening for jobs...")

// Keep process running
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing workers...")
  await Promise.all([
    billingQueue.close(),
    usageAggregationQueue.close(),
    payoutQueue.close(),
    apisixSyncQueue.close(),
    emailQueue.close(),
  ])
  process.exit(0)
})
