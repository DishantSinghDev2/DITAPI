import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { organizationId, name, slug, description, baseUrl, authentication, version } = await request.json()

    const db = await getDatabase()
    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    // Verify user is part of organization
    const org = await db.collection("organizations").findOne({
      _id: new ObjectId(organizationId),
      "members.userId": new ObjectId(user._id),
    })

    if (!org) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const result = await db.collection("apis").insertOne({
      name,
      slug,
      description,
      baseUrl,
      organizationId: new ObjectId(organizationId),
      authentication,
      version,
      status: "active",
      endpoints: [
        {
          path: "/health",
          method: "GET",
          description: "Health check endpoint",
          requiresAuth: false,
        },
      ],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ apiId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
