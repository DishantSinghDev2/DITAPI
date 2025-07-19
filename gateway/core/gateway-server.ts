import { NextResponse, type NextRequest } from "next/server"
import type { GatewayConfig } from "./gateway-config"
import type { ApiResolver } from "./api-resolver"
import type { RequestProcessor } from "./request-processor"
import type { ResponseProcessor } from "./response-processor"
import type { GatewayLogger } from "./gateway-logger"
import type { GatewayMetrics } from "./gateway-metrics"
import { GatewayError } from "../utils/errors"
import type { ApiKey, Api } from "@/types/api"

interface GatewayRequest {
  request: NextRequest
  pathSegments: string[]
  host: string | null
  apiKey: string
  ipAddress: string
  userAgent: string
}

export class GatewayServer {
  constructor(
    private config: GatewayConfig,
    private apiResolver: ApiResolver,
    private requestProcessor: RequestProcessor,
    private responseProcessor: ResponseProcessor,
    private middlewareChain: any[], // Array of middleware instances
    private logger: GatewayLogger,
    private metrics: GatewayMetrics,
  ) {}

  async processRequest(gatewayRequest: GatewayRequest): Promise<NextResponse> {
    const { request, pathSegments, host, apiKey, ipAddress, userAgent } = gatewayRequest
    const startTime = Date.now()
    let api: Api | null = null
    let apiKeyRecord: ApiKey | null = null
    let resolvedUrl: string | null = null
    let response: NextResponse | null = null

    try {
      // 1. Resolve API based on host or path
      const resolutionResult = await this.apiResolver.resolveApi(host, pathSegments)
      api = resolutionResult.api
      const apiPath = resolutionResult.apiPath

      if (!api) {
        throw new GatewayError("API Not Found", 404)
      }

      // 2. Process middleware chain
      const context = {
        request,
        api,
        apiKey,
        apiKeyRecord, // Will be populated by auth middleware
        ipAddress,
        userAgent,
        apiPath,
        config: this.config,
        logger: this.logger,
        metrics: this.metrics,
        response: null as NextResponse | null, // Middleware can set a direct response
      }

      for (const middleware of this.middlewareChain) {
        await middleware.execute(context)
        if (context.response) {
          // Middleware has generated a direct response, stop processing
          response = context.response
          break
        }
      }

      if (response) {
        // If a middleware generated a response, return it
        return response
      }

      // Update apiKeyRecord if authentication middleware populated it
      apiKeyRecord = context.apiKeyRecord

      // 3. Construct target URL
      resolvedUrl = this.requestProcessor.buildTargetUrl(api.baseUrl, apiPath, request.nextUrl.searchParams)

      // 4. Forward request to target API
      const apiResponse = await this.requestProcessor.forwardRequest(request, resolvedUrl)

      // 5. Process response
      response = await this.responseProcessor.processResponse(apiResponse)

      // 6. Log and metric
      const endTime = Date.now()
      const responseTime = endTime - startTime
      this.logger.logRequest(
        apiKeyRecord?.id || null,
        api.id,
        responseTime,
        response.status,
        request.headers.get("content-length") ? Number.parseInt(request.headers.get("content-length")!) : 0,
        response.headers.get("content-length") ? Number.parseInt(response.headers.get("content-length")!) : 0,
        userAgent,
        ipAddress,
      )
      this.metrics.recordRequest(api.id, response.status, responseTime)

      return response
    } catch (error: any) {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      const statusCode = error instanceof GatewayError ? error.statusCode : 500
      const errorMessage = error instanceof GatewayError ? error.message : "Internal Gateway Error"

      // Log the error
      this.logger.logError(error, request.url, apiKeyRecord?.id, api?.id, ipAddress, userAgent, statusCode)
      this.metrics.recordError(api?.id || "unknown", statusCode)

      return NextResponse.json({ error: errorMessage }, { status: statusCode })
    }
  }
}
