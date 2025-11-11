import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const session = await requireAuth()
    const { orgId } = await params
    const db = await getDatabase()

    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    // Verify user is part of organization
    const org = await db.collection("organizations").findOne({
      _id: new ObjectId(orgId),
      "members.userId": new ObjectId(user._id),
    })

    if (!org) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const apis = await db
      .collection("apis")
      .find({ organizationId: new ObjectId(orgId) })
      .toArray()

    return NextResponse.json(apis)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
