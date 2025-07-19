import type { IncomingMessage } from "http"
import type { GatewayLogger } from "./gateway-logger"
import type { GatewayMetrics } from "./gateway-metrics"
import { AuthenticationMiddleware } from "../middleware/authentication"
import { RateLimitMiddleware } from "../middleware/rate-limit"
import { QuotaMiddleware } from "../middleware/quota"
import { SecurityMiddleware } from "../middleware/security"
import { CorsMiddleware } from "../middleware/cors"
import { AnalyticsMiddleware } from "../middleware/analytics"
import type { GatewayRequest, GatewayResponse } from "@/types/gateway"
import type { API, User, Subscription } from "@/types/database"

export interface ProcessedGatewayRequest extends GatewayRequest {
  api: API
  user: User | null
  userSubscription: Subscription | null
  // Add any other data that middleware might add to the request context
}

export interface MiddlewareResult {
  request: ProcessedGatewayRequest
  response?: GatewayResponse // If middleware directly returns a response (e.g., error, redirect)
}

export abstract class BaseGatewayMiddleware {
  protected logger: GatewayLogger

  constructor(logger: GatewayLogger) {
    this.logger = logger
  }

  abstract handle(request: ProcessedGatewayRequest): Promise<MiddlewareResult>
}

export class GatewayMiddleware extends BaseGatewayMiddleware {
  private metrics: GatewayMetrics
  private middlewares: BaseGatewayMiddleware[]

  constructor(logger: GatewayLogger, metrics: GatewayMetrics) {
    super(logger)
    this.metrics = metrics

    // Initialize middleware chain
    this.middlewares = [
      new SecurityMiddleware(logger),
      new CorsMiddleware(logger),
      new AuthenticationMiddleware(logger),
      new RateLimitMiddleware(logger, metrics),
      new QuotaMiddleware(logger, metrics),
      new AnalyticsMiddleware(logger, metrics),
    ]
  }

  async process(req: IncomingMessage, apiContext: any): Promise<MiddlewareResult> {
    let request: ProcessedGatewayRequest = {
      ...req,
      api: apiContext.api,
      user: null,
      userSubscription: null,
    }

    // Execute middleware chain
    for (const middleware of this.middlewares) {
      try {
        const result = await middleware.handle(request)

        if (result.response) {
          return result
        }

        // Merge request context
        request = { ...request, ...result.request }
      } catch (error) {
        this.logger.error("Middleware error", {
          middleware: middleware.constructor.name,
          error: error.message,
          requestId: req.requestId,
        })

        return {
          request,
          response: {
            success: false,
            statusCode: 500,
            error: "Internal middleware error",
          },
        }
      }
    }

    return {
      request,
      response: {
        success: true,
      },
    }
  }
}
