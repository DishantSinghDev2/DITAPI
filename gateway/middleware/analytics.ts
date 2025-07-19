import { GatewayMiddleware, type ProcessedGatewayRequest, type MiddlewareResult } from "../core/gateway-middleware"
import type { GatewayLogger } from "../core/gateway-logger"
import { recordApiUsage } from "@/lib/database/realtime-stats"

export class AnalyticsMiddleware extends GatewayMiddleware {
  constructor(logger: GatewayLogger) {
    super(logger)
  }

  async handle(request: ProcessedGatewayRequest): Promise<MiddlewareResult> {
    this.logger.log("Running AnalyticsMiddleware")

    const startTime = process.hrtime.bigint() // High-resolution time for latency calculation

    // Continue processing the request
    const result = { request }

    // After the request has been processed by other middleware and potentially forwarded,
    // we need to capture the response details. This middleware should ideally run last
    // or have access to the final response.
    // For a simple middleware chain, we'll assume the response is available after the chain.
    // In a more complex setup, this might be an 'after' middleware or a separate logging service.

    // For now, we'll just log the request details. The actual response logging
    // and latency calculation will happen in the gateway-server after the fetch.
    try {
      if (request.api && request.user) {
        // Record a simplified usage metric immediately
        // The full request/response details will be logged by GatewayServer
        await recordApiUsage({
          apiId: request.api.id,
          userId: request.user.id,
          requests: 1,
          dataTransferred: 0, // Placeholder, actual data size determined after response
          errors: 0, // Placeholder, actual error status determined after response
          timestamp: new Date(),
        })
        this.logger.log(`Analytics: Recorded usage for API ${request.api.name} by user ${request.user.id}`)
      } else {
        this.logger.warn("AnalyticsMiddleware: Missing API or user context for usage recording.")
      }
    } catch (error: any) {
      this.logger.error(`AnalyticsMiddleware: Failed to record API usage: ${error.message}`)
    }

    return result
  }
}
