import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-API-Key") || request.nextUrl.searchParams.get("api_key")

    if (!apiKey) {
      return NextResponse.json({ user: null })
    }

    const db = await getDatabase()

    const subscription = await db.collection("subscriptions").findOne({
      apiKeyHash: require("crypto").createHash("sha256").update(apiKey).digest("hex"),
    })

    if (!subscription || subscription.status !== "active") {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: subscription.userId.toString(),
        subscriptionId: subscription._id.toString(),
      },
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ user: null })
  }
}
