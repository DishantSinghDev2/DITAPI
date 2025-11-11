import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest, { params }: { params: { apiId: string } }) {
  try {
    const db = await getDatabase()
    const apiId = new ObjectId(params.apiId)
    const skip = Number.parseInt(req.nextUrl.searchParams.get("skip") || "0")
    const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") || "10")

    const reviews = await db
      .collection("ratings")
      .find({
        apiId,
        status: "approved",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection("ratings").countDocuments({
      apiId,
      status: "approved",
    })

    return NextResponse.json({
      data: reviews,
      total,
      skip,
      limit,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { apiId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const { rating, review } = await req.json()

    // Verify user has active subscription
    const subscription = await db.collection("subscriptions").findOne({
      userId: new ObjectId(session.user.id),
      apiId: new ObjectId(params.apiId),
      status: "active",
    })

    if (!subscription) {
      return NextResponse.json({ error: "Must have active subscription to review" }, { status: 403 })
    }

    // Check for existing review
    const existing = await db.collection("ratings").findOne({
      apiId: new ObjectId(params.apiId),
      userId: new ObjectId(session.user.id),
    })

    if (existing) {
      await db.collection("ratings").updateOne(
        { _id: existing._id },
        {
          $set: {
            rating,
            review,
            status: "pending",
            updatedAt: new Date(),
          },
        },
      )
      return NextResponse.json({ _id: existing._id, updated: true })
    }

    const result = await db.collection("ratings").insertOne({
      apiId: new ObjectId(params.apiId),
      userId: new ObjectId(session.user.id),
      rating,
      review,
      status: "pending",
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ _id: result.insertedId })
  } catch (error) {
    console.error("[v0] Review error:", error)
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
  }
}
