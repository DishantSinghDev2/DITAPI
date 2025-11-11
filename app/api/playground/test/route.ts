import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const { apiId, endpointPath, method, headers, body, queryParams } = await req.json()

    // Get subscription and API key
    const subscription = await db.collection("subscriptions").findOne({
      userId: new ObjectId(session.user.id),
      apiId: new ObjectId(apiId),
      status: "active",
    })

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription" }, { status: 403 })
    }

    const api = await db.collection("apis").findOne({ _id: new ObjectId(apiId) })
    if (!api) return NextResponse.json({ error: "API not found" }, { status: 404 })

    // Build request
    const url = new URL(api.baseUrl)
    url.pathname = endpointPath
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    // Add API key to headers
    const requestHeaders = {
      ...headers,
      "X-API-Key": subscription.apiKey,
      "Content-Type": "application/json",
    }

    // Make request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const startTime = Date.now()
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const duration = Date.now() - startTime
    clearTimeout(timeoutId)

    const responseBody = await response.text()
    let parsedBody: any
    try {
      parsedBody = JSON.parse(responseBody)
    } catch {
      parsedBody = responseBody
    }

    // Log test
    await db.collection("playground_tests").insertOne({
      userId: new ObjectId(session.user.id),
      apiId: new ObjectId(apiId),
      endpoint: endpointPath,
      method,
      status: response.status,
      duration,
      createdAt: new Date(),
    })

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      body: parsedBody,
      duration,
      timestamp: new Date(),
    })
  } catch (error: any) {
    console.error("[v0] Playground test error:", error)
    return NextResponse.json({ error: error.message || "Test failed" }, { status: 500 })
  }
}
