import { GatewayMiddleware, type ProcessedGatewayRequest, type MiddlewareResult } from "../core/gateway-middleware"
import type { GatewayLogger } from "../core/gateway-logger"

export class CorsMiddleware extends GatewayMiddleware {
  constructor(logger: GatewayLogger) {
    super(logger)
  }

  async handle(request: ProcessedGatewayRequest): Promise<MiddlewareResult> {
    this.logger.log("Running CorsMiddleware")

    const origin = request.headers["origin"]
    const requestMethod = request.headers["access-control-request-method"]
    const requestHeaders = request.headers["access-control-request-headers"]

    // In a real application, allowed origins would be configured per API or globally
    // For now, allow all origins for simplicity, but this should be restricted in production
    const allowedOrigins = ["*", "http://localhost:3000", "https://your-app-domain.com"] // Example allowed origins
    const isOriginAllowed = allowedOrigins.includes("*") || (origin && allowedOrigins.includes(origin))

    const corsHeaders: { [key: string]: string } = {}

    if (isOriginAllowed) {
      corsHeaders["Access-Control-Allow-Origin"] = origin || "*"
      corsHeaders["Access-Control-Allow-Credentials"] = "true" // If you need to send cookies/auth headers
    } else {
      this.logger.warn(`CORS: Origin ${origin} not allowed.`)
      // If origin is not allowed, we might return a 403 or just not add CORS headers.
      // For preflight, it's better to return 403. For actual requests, just omit headers.
    }

    // Handle preflight OPTIONS requests
    if (request.method === "OPTIONS" && origin && requestMethod && requestHeaders) {
      this.logger.log("CORS: Handling preflight request.")
      if (isOriginAllowed) {
        corsHeaders["Access-Control-Allow-Methods"] = requestMethod
        corsHeaders["Access-Control-Allow-Headers"] = requestHeaders
        corsHeaders["Access-Control-Max-Age"] = "86400" // Cache preflight for 24 hours
        return {
          request,
          response: {
            status: 204, // No Content
            headers: corsHeaders,
            body: null,
          },
        }
      } else {
        return {
          request,
          response: {
            status: 403, // Forbidden
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Forbidden: CORS origin not allowed" }),
          },
        }
      }
    }

    // For actual requests, just add the Access-Control-Allow-Origin header
    // The ResponseProcessor will also add these, but it's good to have it here too for consistency
    if (isOriginAllowed) {
      request.headers = { ...request.headers, ...corsHeaders }
    }

    this.logger.log("CorsMiddleware: Passed.")
    return { request }
  }
}
