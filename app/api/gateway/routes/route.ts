import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { apisixService } from "@/lib/apisix"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { session, user } = await requireRole("provider")
    const { apiId } = await request.json()

    const db = await getDatabase()

    // Verify API ownership
    const api = await db.collection("apis").findOne({
      _id: new ObjectId(apiId),
    })

    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 })
    }

    try {
      const routeId = `route-${api._id}`
      const upstreamId = `upstream-${api._id}`

      // Extract host from baseUrl
      const url = new URL(api.baseUrl)

      // Create upstream (backend pool)
      await apisixService.createUpstream(upstreamId, {
        type: "roundrobin",
        nodes: {
          [`${url.hostname}:${url.port || 443}`]: 1,
        },
      })

      // Create route
      await apisixService.createRoute(routeId, {
        uri: `/api/${api.slug}/*`,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        upstream: {
          type: "roundrobin",
          nodes: {
            [`${url.hostname}:${url.port || 443}`]: 1,
          },
        },
        plugins: {
          // API Key authentication
          "key-auth": {
            header: "X-API-Key",
            query: "api_key",
          },
          // Rate limiting
          "limit-count": {
            count: api.rateLimit?.requestsPerMinute || 60,
            time_window: 60,
            rejected_code: 429,
          },
          // Request logging
          "http-logger": {
            uri: `${process.env.NEXTAUTH_URL}/api/gateway/logs`,
            batch_max_size: 100,
            timeout: 3000,
          },
        },
      })

      // Update API with APISIX route info
      await db.collection("apis").updateOne(
        { _id: new ObjectId(apiId) },
        {
          $set: {
            "metadata.apisixRouteId": routeId,
            "metadata.apisixUpstreamId": upstreamId,
            updatedAt: new Date(),
          },
        },
      )

      return NextResponse.json({
        success: true,
        routeId,
        upstreamId,
      })
    } catch (apisixError) {
      console.error("APISIX error:", apisixError)
      return NextResponse.json({ error: "Failed to create gateway route" }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
