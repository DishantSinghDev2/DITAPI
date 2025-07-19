import { type NextRequest, NextResponse } from "next/server"
import { gatewayServer } from "@/gateway/core/gateway-server"
import type { GatewayRequest, GatewayResponse } from "@/types/gateway"

export const runtime = "nodejs" // Ensure this route runs in Node.js environment

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const gatewayRequest: GatewayRequest = {
    method: "GET",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: null, // GET requests typically don't have a body
    ip: request.ip || "unknown",
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
  const body = await request.text() // Read body as text for flexibility

  const gatewayRequest: GatewayRequest = {
    method: "POST",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    ip: request.ip || "unknown",
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
  const body = await request.text()

  const gatewayRequest: GatewayRequest = {
    method: "PUT",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    ip: request.ip || "unknown",
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
  const body = await request.text()

  const gatewayRequest: GatewayRequest = {
    method: "DELETE",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    ip: request.ip || "unknown",
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
  const body = await request.text()

  const gatewayRequest: GatewayRequest = {
    method: "PATCH",
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    ip: request.ip || "unknown",
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
    ip: request.ip || "unknown",
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
    ip: request.ip || "unknown",
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
