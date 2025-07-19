import { type NextRequest, NextResponse } from "next/server"
import { GatewayCore } from "@/lib/gateway/gateway-core"

const gateway = new GatewayCore()

// This route handler is a placeholder for the root /api/gateway route.
// The actual gateway logic is handled by app/api/gateway/[...path]/route.ts
// This file exists to catch requests to /api/gateway directly, which should
// typically return a 200 or a generic message, as it's not a valid API endpoint itself.

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: "DITAPI Gateway is operational. Please specify an API path.",
      example_usage: "GET /api/gateway/your-api-slug/v1/endpoint",
      documentation: "https://ditapi.info/docs/gateway",
    },
    { status: 200 },
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      message: "DITAPI Gateway is operational. Please specify an API path.",
      example_usage: "POST /api/gateway/your-api-slug/v1/endpoint",
      documentation: "https://ditapi.info/docs/gateway",
    },
    { status: 200 },
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: "Invalid API Gateway endpoint. Please specify an API path (e.g., /gateway/my-api/endpoint)." },
    { status: 404 },
  )
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: "Invalid API Gateway endpoint. Please specify an API path (e.g., /gateway/my-api/endpoint)." },
    { status: 404 },
  )
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { error: "Invalid API Gateway endpoint. Please specify an API path (e.g., /gateway/my-api/endpoint)." },
    { status: 404 },
  )
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    { error: "Invalid API Gateway endpoint. Please specify an API path (e.g., /gateway/my-api/endpoint)." },
    { status: 404 },
  )
}

// async function handleGatewayRequest(request: NextRequest, method: string) {
//   const startTime = Date.now()
//   const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

//   try {
//     // Extract path from URL
//     const url = new URL(request.url)
//     const pathSegments = url.pathname.replace("/api/gateway/", "").split("/").filter(Boolean)

//     if (pathSegments.length === 0) {
//       return NextResponse.json(
//         {
//           error: "API endpoint required",
//           message: "Please specify an API endpoint in the path",
//           documentation: "https://docs.ditapi.info/gateway",
//         },
//         { status: 400 },
//       )
//     }

//     // Process through gateway
//     const result = await gateway.processRequest({
//       method,
//       path: pathSegments,
//       headers: Object.fromEntries(request.headers.entries()),
//       query: Object.fromEntries(url.searchParams.entries()),
//       body: method !== "GET" && method !== "HEAD" ? await request.text() : undefined,
//       requestId,
//       startTime,
//     })

//     // Return response
//     return new NextResponse(result.body, {
//       status: result.status,
//       headers: result.headers,
//     })
//   } catch (error) {
//     console.error(`Gateway error [${requestId}]:`, error)

//     return NextResponse.json(
//       {
//         error: "Gateway Error",
//         message: "An error occurred while processing your request",
//         request_id: requestId,
//         timestamp: new Date().toISOString(),
//       },
//       {
//         status: 500,
//         headers: {
//           "X-DITAPI-Request-ID": requestId,
//           "X-DITAPI-Response-Time": `${Date.now() - startTime}ms`,
//         },
//       },
//     )
//   }
// }
