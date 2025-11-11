import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { generateAPIKey, hashAPIKey } from "@/lib/apikey-utils"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { apiId, planId } = await request.json()

    const db = await getDatabase()
    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for existing subscription
    const existingSubscription = await db.collection("subscriptions").findOne({
      userId: user._id,
      apiId: new ObjectId(apiId),
    })

    if (existingSubscription && existingSubscription.status !== "cancelled") {
      return NextResponse.json({ error: "Already subscribed to this API" }, { status: 400 })
    }

    const plan = await db.collection("plans").findOne({
      _id: new ObjectId(planId),
      apiId: new ObjectId(apiId),
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const apiKey = generateAPIKey()
    const apiKeyHash = hashAPIKey(apiKey)

    const subscriptionData = {
      userId: user._id,
      apiId: new ObjectId(apiId),
      planId: new ObjectId(planId),
      organizationId: new ObjectId(), // Placeholder, would be user's org or trial org
      status: plan.trialDays ? "trial" : "active",
      apiKey,
      apiKeyHash,
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelledAt: null,
      metadata: {
        trialEndsAt: plan.trialDays ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("subscriptions").insertOne(subscriptionData)

    // Create initial invoice if not trial
    if (!plan.trialDays) {
      await db.collection("invoices").insertOne({
        subscriptionId: result.insertedId,
        userId: user._id,
        amount: plan.price,
        currency: "USD",
        status: "pending",
        description: `Subscription to ${(await db.collection("apis").findOne({ _id: new ObjectId(apiId) }))?.name}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invoiceNumber: `INV-${result.insertedId}-${Date.now()}`,
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
    }

    return NextResponse.json({
      subscriptionId: result.insertedId,
      apiKey,
      message: "Subscription created successfully",
    })
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const db = await getDatabase()

    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscriptions = await db
      .collection("subscriptions")
      .aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: "apis",
            localField: "apiId",
            foreignField: "_id",
            as: "api",
          },
        },
        {
          $lookup: {
            from: "plans",
            localField: "planId",
            foreignField: "_id",
            as: "plan",
          },
        },
        { $unwind: "$api" },
        { $unwind: "$plan" },
      ])
      .toArray()

    return NextResponse.json(subscriptions)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
