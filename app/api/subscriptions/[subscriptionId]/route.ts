import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ subscriptionId: string }> }) {
  try {
    const session = await requireAuth()
    const { subscriptionId } = await params

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

    // Get usage stats
    const usage = await db
      .collection("usage")
      .find({ subscriptionId: new ObjectId(subscriptionId) })
      .sort({ date: -1 })
      .limit(30)
      .toArray()

    return NextResponse.json({ subscription, usage })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ subscriptionId: string }> }) {
  try {
    const session = await requireAuth()
    const { subscriptionId } = await params

    const db = await getDatabase()
    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    const result = await db.collection("subscriptions").updateOne(
      {
        _id: new ObjectId(subscriptionId),
        userId: user._id,
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Subscription cancelled" })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
