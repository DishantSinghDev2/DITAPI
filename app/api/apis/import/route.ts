import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { extractAPIDetailsWithAI } from "@/lib/gemini"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "provider") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const organizationId = formData.get("organizationId") as string

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Extract API details using Gemini AI
    const apiDetails = await extractAPIDetailsWithAI(buffer, file.name)

    const db = await getDatabase()

    // Verify organization ownership
    const org = await db.collection("organizations").findOne({
      _id: new ObjectId(organizationId),
      "members.userId": new ObjectId(session.user.id),
    })

    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    // Check for duplicate
    const existing = await db.collection("apis").findOne({
      organizationId: new ObjectId(organizationId),
      slug: apiDetails.name.toLowerCase().replace(/\s+/g, "-"),
    })

    if (existing) {
      return NextResponse.json({ error: "API with this name already exists", apiId: existing._id }, { status: 400 })
    }

    // Create API
    const result = await db.collection("apis").insertOne({
      name: apiDetails.name,
      slug: apiDetails.name.toLowerCase().replace(/\s+/g, "-"),
      description: apiDetails.description,
      organizationId: new ObjectId(organizationId),
      baseUrl: apiDetails.baseUrl,
      status: "active",
      version: "1.0.0",
      authentication: apiDetails.authentication || "api_key",
      rateLimit: apiDetails.rateLimit,
      endpoints: apiDetails.endpoints || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create default plan
    await db.collection("plans").insertOne({
      apiId: result.insertedId,
      name: "Starter",
      slug: "starter",
      description: "Perfect for getting started",
      price: 9.99,
      currency: "USD",
      billingCycle: "monthly",
      rateLimit: 100,
      requestsPerDay: 1000,
      features: ["Basic support", "API access"],
      status: "active",
      trialDays: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      apiId: result.insertedId,
      apiDetails,
    })
  } catch (error) {
    console.error("[v0] Import error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 500 })
  }
}
