import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

interface ApisixLog {
  client_ip: string
  timestamp: number
  request: {
    method: string
    uri: string
    size: number
  }
  response: {
    status: number
    size: number
  }
  latency: number
}

export async function POST(request: NextRequest) {
  try {
    const logs: ApisixLog[] = await request.json()

    if (!Array.isArray(logs)) {
      return NextResponse.json({ error: "Invalid logs format" }, { status: 400 })
    }

    const db = await getDatabase()

    for (const log of logs) {
      try {
        // Extract subscription ID from request headers or URI
        const uriParts = log.request.uri.split("/")
        const apiSlug = uriParts[2] // /api/{slug}/...

        // Find API by slug
        const api = await db.collection("apis").findOne({ slug: apiSlug })

        if (!api) continue

        // Find subscription by API
        const subscriptions = await db.collection("subscriptions").find({ apiId: api._id, status: "active" }).toArray()

        for (const subscription of subscriptions) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          // Update or create usage record
          await db.collection("usage").updateOne(
            {
              subscriptionId: subscription._id,
              apiId: api._id,
              date: today,
            },
            {
              $inc: {
                requestCount: 1,
                [`statusCodes.${log.response.status}`]: 1,
              },
              $set: {
                avgResponseTime:
                  (log.latency +
                    (
                      await db.collection("usage").findOne({
                        subscriptionId: subscription._id,
                        apiId: api._id,
                        date: today,
                      })
                    )?.avgResponseTime || 0) / 2,
              },
            },
            { upsert: true },
          )
        }
      } catch (err) {
        console.error("Error processing log:", err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logging error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
