import { type NextRequest, NextResponse } from "next/server"
import { gatewayServer } from "@/lib/gateway/gateway-core" // Corrected import path
import type { GatewayRequest, GatewayResponse } from "@/types/api" // Using types/api for Gateway types

export const runtime = "nodejs" // Ensure this route runs in Node.js environment

// Helper to get request body based on content-type
async function getRequestBody(request: NextRequest): Promise<string | null> {
  const contentType = request.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    return JSON.stringify(await request.json())
  } else if (contentType?.includes("text/plain")) {
    return request.text()
  } else if (contentType?.includes("application/x-www-form-urlencoded")) {
    return request.text() // Or parse as FormData if needed
  } else if (contentType?.includes("multipart/form-data")) {
    // Handle multipart form data if necessary, might need a library
    return null // For simplicity, not handling complex multipart bodies
  }
  return null
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const gatewayRequest: GatewayRequest = {
    method: "GET",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: null, // GET requests typically don't have a body
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
  }

  try {
    const gatewayResponse: GatewayResponse = await gatewayServer.handleRequest(gatewayRequest)

    const response = new NextResponse(gatewayResponse.body, {
      status: gatewayResponse.status,
      headers: gatewayResponse.headers,
    })
    return response
  } catch (error: any) {
    console.error("Gateway GET error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const body = await getRequestBody(request)

  const gatewayRequest: GatewayRequest = {
    method: "POST",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
  }

  try {
    const gatewayResponse: GatewayResponse = await gatewayServer.handleRequest(gatewayRequest)

    const response = new NextResponse(gatewayResponse.body, {
      status: gatewayResponse.status,
      headers: gatewayResponse.headers,
    })
    return response
  } catch (error: any) {
    console.error("Gateway POST error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const body = await getRequestBody(request)

  const gatewayRequest: GatewayRequest = {
    method: "PUT",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
  }

  try {
    const gatewayResponse: GatewayResponse = await gatewayServer.handleRequest(gatewayRequest)

    const response = new NextResponse(gatewayResponse.body, {
      status: gatewayResponse.status,
      headers: gatewayResponse.headers,
    })
    return response
  } catch (error: any) {
    console.error("Gateway PUT error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const body = await getRequestBody(request)

  const gatewayRequest: GatewayRequest = {
    method: "DELETE",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
  }

  try {
    const gatewayResponse: GatewayResponse = await gatewayServer.handleRequest(gatewayRequest)

    const response = new NextResponse(gatewayResponse.body, {
      status: gatewayResponse.status,
      headers: gatewayResponse.headers,
    })
    return response
  } catch (error: any) {
    console.error("Gateway DELETE error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const body = await getRequestBody(request)

  const gatewayRequest: GatewayRequest = {
    method: "PATCH",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
  }

  try {
    const gatewayResponse: GatewayResponse = await gatewayServer.handleRequest(gatewayRequest)

    const response = new NextResponse(gatewayResponse.body, {
      status: gatewayResponse.status,
      headers: gatewayResponse.headers,
    })
    return response
  } catch (error: any) {
    console.error("Gateway PATCH error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function HEAD(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const gatewayRequest: GatewayRequest = {
    method: "HEAD",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: null,
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
  }

  try {
    const gatewayResponse: GatewayResponse = await gatewayServer.handleRequest(gatewayRequest)

    const response = new NextResponse(null, {
      status: gatewayResponse.status,
      headers: gatewayResponse.headers,
    })
    return response
  } catch (error: any) {
    console.error("Gateway HEAD error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const gatewayRequest: GatewayRequest = {
    method: "OPTIONS",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: null,
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
  }

  try {
    const gatewayResponse: GatewayResponse = await gatewayServer.handleRequest(gatewayRequest)

    const response = new NextResponse(null, {
      status: gatewayResponse.status,
      headers: gatewayResponse.headers,
    })
    return response
  } catch (error: any) {
    console.error("Gateway OPTIONS error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
