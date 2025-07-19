import type { ServerResponse } from "http"
import type { GatewayMiddleware } from "./gateway-middleware"
import type { GatewayLogger } from "./gateway-logger"
import { ApiResolver } from "./api-resolver"
import { RequestProcessor } from "./request-processor"
import { ResponseProcessor } from "./response-processor"
import type { API } from "@/types/database"
import { getActiveSubscriptionForUserAndApi } from "@/lib/database/subscription-queries"
import { getUserSession } from "@/lib/auth/session"
import type { GatewayConfig } from "./gateway-config"
import { AuthenticationMiddleware } from "../middleware/authentication"
import { RateLimitMiddleware } from "../middleware/rate-limit"
import { QuotaMiddleware } from "../middleware/quota"
import { SecurityMiddleware } from "../middleware/security"
import { CorsMiddleware } from "../middleware/cors"
import { AnalyticsMiddleware } from "../middleware/analytics"
import type { GatewayRequest, GatewayResponse } from "@/types/gateway"

export class GatewayRouter {
  private config: GatewayConfig
  private logger: GatewayLogger
  private apiResolver: ApiResolver
  private requestProcessor: RequestProcessor
  private responseProcessor: ResponseProcessor
  private middleware: GatewayMiddleware[]

  constructor(config: GatewayConfig, logger: GatewayLogger) {
    this.config = config
    this.logger = logger
    this.apiResolver = new ApiResolver(config, logger)
    this.requestProcessor = new RequestProcessor(logger)
    this.responseProcessor = new ResponseProcessor(logger)

    this.middleware = [
      new AuthenticationMiddleware(logger),
      new RateLimitMiddleware(logger),
      new QuotaMiddleware(logger),
      new SecurityMiddleware(logger),
      new CorsMiddleware(logger),
      new AnalyticsMiddleware(logger),
    ]
  }

  public async route(request: GatewayRequest): Promise<GatewayResponse> {
    this.logger.log(`Routing request: ${request.method} ${request.url}`)

    const url = new URL(request.url)
    const subdomain = url.hostname.split(".")[0]
    const path = url.pathname

    let api: API | null = null
    let userSubscription: any | null = null // TODO: Define Subscription type

    // 1. Resolve API based on subdomain or path
    try {
      api = await this.apiResolver.resolveApi(subdomain, path)
      if (!api) {
        this.logger.warn(`API not found for subdomain: ${subdomain} and path: ${path}`)
        return {
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "API not found" }),
        }
      }
      this.logger.log(`API resolved: ${api.name} (ID: ${api.id})`)
    } catch (error: any) {
      this.logger.error(`Error resolving API: ${error.message}`)
      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Error resolving API", error: error.message }),
      }
    }

    // 2. Get user session and subscription if authenticated
    const session = await getUserSession()
    if (session?.user) {
      this.logger.log(`User authenticated: ${session.user.id}`)
      try {
        userSubscription = await getActiveSubscriptionForUserAndApi(session.user.id, api.id)
        if (userSubscription) {
          this.logger.log(`User has active subscription for API ${api.name}: Plan ${userSubscription.planName}`)
        } else {
          this.logger.warn(`User ${session.user.id} has no active subscription for API ${api.name}`)
        }
      } catch (error: any) {
        this.logger.error(`Error fetching user subscription: ${error.message}`)
        // Continue without subscription, middleware will handle access
      }
    } else {
      this.logger.log("User not authenticated.")
    }

    // 3. Process request through middleware chain
    let processedRequest = { ...request, api, user: session?.user || null, userSubscription }
    let response: GatewayResponse | null = null

    for (const mw of this.middleware) {
      try {
        const mwResult = await mw.handle(processedRequest)
        if (mwResult.response) {
          // Middleware returned a direct response (e.g., error, rate limit exceeded)
          response = mwResult.response
          this.logger.log(`Middleware ${mw.constructor.name} returned direct response with status ${response.status}`)
          break
        }
        processedRequest = mwResult.request // Update request for next middleware
      } catch (error: any) {
        this.logger.error(`Middleware ${mw.constructor.name} failed: ${error.message}`)
        return {
          status: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `Gateway middleware error: ${mw.constructor.name}`, error: error.message }),
        }
      }
    }

    if (response) {
      return response // Return response from middleware if available
    }

    // 4. Process the request (e.g., add API key, transform body)
    const finalRequest = this.requestProcessor.process(processedRequest)

    // 5. Forward request to the actual API
    this.logger.log(
      `Forwarding request to target API: ${api.base_url}${finalRequest.url.split(this.config.gatewayBasePath)[1] || ""}`,
    )
    let apiResponse: Response
    try {
      const targetUrl = new URL(finalRequest.url.replace(this.config.gatewayBasePath, api.base_url))
      apiResponse = await fetch(targetUrl.toString(), {
        method: finalRequest.method,
        headers: finalRequest.headers,
        body: finalRequest.body,
        redirect: "manual", // Prevent automatic redirects
      })
      this.logger.log(`Received response from target API with status: ${apiResponse.status}`)
    } catch (error: any) {
      this.logger.error(`Error forwarding request to API: ${error.message}`)
      return {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Bad Gateway: Could not reach target API", error: error.message }),
      }
    }

    // 6. Process the response (e.g., remove sensitive headers, transform body)
    const processedResponse = await this.responseProcessor.process(apiResponse)

    return processedResponse
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split(".")
    if (parts.length >= 3 && parts[parts.length - 2] === "ditapi" && parts[parts.length - 1] === "info") {
      return parts[0]
    }
    return null
  }

  private async executeUpstreamRequest(request: any) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private sendResponse(res: ServerResponse, processedResponse: any, requestId: string, responseTime: number) {
    // Set headers
    Object.entries(processedResponse.headers).forEach(([key, value]) => {
      res.setHeader(key, value as string)
    })

    // Add gateway headers
    res.setHeader("X-DITAPI-Request-ID", requestId)
    res.setHeader("X-DITAPI-Response-Time", `${responseTime}ms`)
    res.setHeader("X-DITAPI-Gateway", "v1.0")

    // Send response
    res.writeHead(processedResponse.status)
    res.end(processedResponse.body)
  }

  private sendError(res: ServerResponse, status: number, message: string, requestId: string, headers: any = {}) {
    const errorResponse = {
      error: true,
      message,
      request_id: requestId,
      timestamp: new Date().toISOString(),
    }

    res.writeHead(status, {
      "Content-Type": "application/json",
      "X-DITAPI-Request-ID": requestId,
      "X-DITAPI-Gateway": "v1.0",
      ...headers,
    })
    res.end(JSON.stringify(errorResponse, null, 2))
  }
}
