import type { NextRequest } from "next/server"
import { GatewayServer } from "@/gateway/core/gateway-server"
import { GatewayConfig } from "@/gateway/core/gateway-config"
import { ApiResolver } from "@/gateway/core/api-resolver"
import { RequestProcessor } from "@/gateway/core/request-processor"
import { ResponseProcessor } from "@/gateway/core/response-processor"
import { GatewayLogger } from "@/gateway/core/gateway-logger"
import { GatewayMetrics } from "@/gateway/core/gateway-metrics"
import { AuthenticationMiddleware } from "@/gateway/middleware/authentication"
import { RateLimitMiddleware } from "@/gateway/middleware/rate-limit"
import { QuotaMiddleware } from "@/gateway/middleware/quota"
import { SecurityMiddleware } from "@/gateway/middleware/security"
import { CorsMiddleware } from "@/gateway/middleware/cors"
import { AnalyticsMiddleware } from "@/gateway/middleware/analytics"
import type { GatewayRequest } from "@/types/gateway"

// Initialize gateway components
const apiResolver = new ApiResolver()
const requestProcessor = new RequestProcessor()
const responseProcessor = new ResponseProcessor()
const logger = new GatewayLogger(GatewayConfig.logging)
const metrics = new GatewayMetrics()

// Initialize middleware chain
const middlewareChain = [
  new SecurityMiddleware(gatewayConfig.security),
  new CorsMiddleware(gatewayConfig.cors),
  new AuthenticationMiddleware(),
  new RateLimitMiddleware(gatewayConfig.rateLimit),
  new QuotaMiddleware(gatewayConfig.quota),
  new AnalyticsMiddleware(),
]

// Initialize gateway server
const gatewayServer = new GatewayServer(
  gatewayConfig,
  apiResolver,
  requestProcessor,
  responseProcessor,
  middlewareChain,
  logger,
  metrics,
)

async function handleGatewayRequest(request: NextRequest, pathSegments: string[]) {
  // Extract request information
  const host = request.headers.get("host")
  const apiKey = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("api_key") || ""
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  const gatewayRequest: GatewayRequest = {
    request,
    pathSegments,
    host,
    apiKey,
    ipAddress,
    userAgent,
  }

  return gatewayServer.processRequest(gatewayRequest)
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params.path)
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params.path)
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params.path)
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params.path)
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params.path)
}

export async function OPTIONS(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params.path)
}
