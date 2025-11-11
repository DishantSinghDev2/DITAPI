import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: Promise<{ apiId: string }> }) {
  try {
    const session = await requireAuth()
    const { apiId } = await params
    const { name, slug, description, price, billingCycle, rateLimit, requestsPerDay, features, trialDays } =
      await request.json()

    const db = await getDatabase()
    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    // Verify API ownership
    const api = await db.collection("apis").findOne({
      _id: new ObjectId(apiId),
      organizationId: { $in: await getOrgIdsForUser(db, user._id) },
    })

    if (!api) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const result = await db.collection("plans").insertOne({
      apiId: new ObjectId(apiId),
      name,
      slug,
      description,
      price,
      currency: "USD",
      billingCycle,
      rateLimit,
      requestsPerDay,
      features: features || [],
      trialDays: trialDays || 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ planId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getOrgIdsForUser(db: any, userId: ObjectId) {
  const orgs = await db
    .collection("organizations")
    .find({
      "members.userId": userId,
    })
    .toArray()
  return orgs.map((org: any) => org._id)
}
