import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

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

    const organizations = await db
      .collection("organizations")
      .find({
        "members.userId": new ObjectId(user._id),
      })
      .toArray()

    return NextResponse.json(organizations)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { name, slug, description, logo } = await request.json()

    const db = await getDatabase()
    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const result = await db.collection("organizations").insertOne({
      name,
      slug,
      description,
      logo,
      ownerId: user._id,
      members: [
        {
          userId: user._id,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
      webhookUrl: null,
      webhookSecret: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ organizationId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
