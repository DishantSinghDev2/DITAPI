import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const userId = new ObjectId(session.user.id)

    const credit = await db.collection("credits").findOne({ userId })

    if (!credit) {
      return NextResponse.json({
        userId,
        amount: 0,
        used: 0,
        available: 0,
        history: [],
      })
    }

    // Fetch credit history
    const history = await db
      .collection("credit_transactions")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      ...credit,
      history,
    })
  } catch (error) {
    console.error("[v0] Credits fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const { amount, paymentMethodId } = await req.json()
    const userId = new ObjectId(session.user.id)

    // Process payment via PayPal or Stripe
    // For now, simulate instant purchase
    const result = await db.collection("credits").updateOne(
      { userId },
      {
        $inc: {
          amount,
          available: amount,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    // Log transaction
    await db.collection("credit_transactions").insertOne({
      userId,
      type: "purchase",
      amount,
      balance: (await db.collection("credits").findOne({ userId }))?.amount || amount,
      description: `Purchased ${amount} credits`,
      paymentMethodId,
      status: "completed",
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, credits: amount })
  } catch (error) {
    console.error("[v0] Credit purchase error:", error)
    return NextResponse.json({ error: "Failed to purchase credits" }, { status: 500 })
  }
}
