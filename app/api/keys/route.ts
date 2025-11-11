import { connectToDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import crypto from "crypto"
import { syncApiKeyWithApisix } from "@/lib/apisix-sync"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { apiId, planId, subscriptionId } = await request.json()
    const { db } = await connectToDatabase()

    // Verify subscription
    const subscription = await db.collection("subscriptions").findOne({
      _id: subscriptionId,
      userId: session.user.id,
      status: "active",
    })

    if (!subscription) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 403 })
    }

    // Generate API key
    const keyValue = `sk_${crypto.randomBytes(32).toString("hex")}`
    const keyHash = crypto.createHash("sha256").update(keyValue).digest("hex")

    const result = await db.collection("api_keys").insertOne({
      userId: session.user.id,
      apiId,
      planId,
      subscriptionId,
      keyHash,
      status: "active",
      apisix: {},
      createdAt: new Date(),
    })

    const keyId = result.insertedId.toString()

    // Sync with APISIX
    await syncApiKeyWithApisix(keyId, keyValue)

    // Add key to subscription
    await db.collection("subscriptions").updateOne({ _id: subscriptionId }, { $push: { keys: keyId } })

    return NextResponse.json({ keyId, key: keyValue })
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}
