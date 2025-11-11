import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import crypto from "crypto"

interface WebhookEvent {
  type: string
  data: any
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-webhook-signature")
    const body = await request.text()

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    const db = await getDatabase()
    const event: WebhookEvent = JSON.parse(body)

    const computedSignature = crypto
      .createHmac("sha256", process.env.WEBHOOK_SECRET || "")
      .update(body)
      .digest("hex")

    if (computedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Store webhook event for processing
    await db.collection("webhookEvents").insertOne({
      ...event,
      processed: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
