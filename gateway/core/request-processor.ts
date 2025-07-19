import type { IncomingMessage } from "http"
import type { GatewayLogger } from "./gateway-logger"
import type { ProcessedGatewayRequest } from "./gateway-middleware"
import { Request } from "node-fetch"

export class RequestProcessor {
  private logger: GatewayLogger

  constructor(logger: GatewayLogger) {
    this.logger = logger
  }

  async prepare(req: IncomingMessage, apiContext: any, middlewareContext: any) {
    try {
      // Build target URL
      const targetUrl = this.buildTargetUrl(req, apiContext)

      // Prepare headers
      const headers = this.prepareHeaders(req, apiContext, middlewareContext)

      // Get request body
      const body = await this.getRequestBody(req)

      return {
        url: targetUrl,
        method: req.method,
        headers,
        body,
      }
    } catch (error) {
      this.logger.error("Request preparation error", { error: error.message, requestId: req.requestId })
      throw error
    }
  }

  public process(request: ProcessedGatewayRequest): Request {
    this.logger.log(`Processing outgoing request for API: ${request.api.name}`)

    const headers = new Headers(request.headers)

    // Example: Add API key from environment or database if needed by the target API
    // This is a placeholder. In a real scenario, API keys would be managed per API/provider.
    // For demonstration, let's assume a generic API key for the target API.
    // In a real system, this would come from the API's configuration in the database.
    // if (request.api.apiKey) {
    //   headers.set('X-API-Key', request.api.apiKey);
    // }

    // Remove headers that should not be forwarded to the target API
    headers.delete("host") // Host header should be set by the target server
    headers.delete("connection") // Connection header is hop-by-hop
    headers.delete("x-forwarded-for") // These are handled by the proxy/load balancer
    headers.delete("x-forwarded-host")
    headers.delete("x-forwarded-proto")
    headers.delete("x-real-ip")
    headers.delete("accept-encoding") // Let the target API handle encoding

    // Construct the target URL. The path needs to be relative to the API's base_url.
    // The gateway path is /api/gateway/[...path]
    // The incoming request URL is like http://localhost:3000/api/gateway/openai-gpt4/chat/completions
    // The target API base_url is like https://api.openai.com/v1
    // We need to extract /openai-gpt4/chat/completions and replace /openai-gpt4 with /v1
    const gatewayBasePath = process.env.NEXT_PUBLIC_DITAPI_SUBDOMAIN_BASE ? `/api/gateway/` : `/api/gateway/` // Adjust if base path changes
    const relativePath = request.url.split(gatewayBasePath)[1] || ""
    const apiSlug = request.api.slug
    const finalPath = relativePath.replace(`${apiSlug}/`, "") // Remove the API slug from the path

    const targetUrl = new URL(finalPath, request.api.base_url) // Use URL constructor for robust path joining

    this.logger.log(`Transformed request URL to: ${targetUrl.toString()}`)

    return new Request(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
      // Add other request options like cache, credentials, etc. if needed
      // cache: 'no-store',
      // redirect: 'manual',
    })
  }

  private buildTargetUrl(req: IncomingMessage, apiContext: any): string {
    const url = new URL(req.url || "", `http://${req.headers.host}`)
    const targetUrl = new URL(url.pathname + url.search, apiContext.baseUrl)

    // Remove api_key from query params if present
    targetUrl.searchParams.delete("api_key")

    return targetUrl.toString()
  }

  private prepareHeaders(req: IncomingMessage, apiContext: any, middlewareContext: any): Record<string, string> {
    const headers: Record<string, string> = {}

    // Copy safe headers
    const safeHeaders = [
      "accept",
      "accept-encoding",
      "accept-language",
      "cache-control",
      "content-type",
      "content-length",
      "user-agent",
    ]

    safeHeaders.forEach((header) => {
      const value = req.headers[header]
      if (value && typeof value === "string") {
        headers[header] = value
      }
    })

    // Add gateway headers
    headers["x-forwarded-for"] = this.getClientIp(req)
    headers["x-ditapi-gateway"] = "v1.0"
    headers["x-ditapi-api"] = apiContext.name
    headers["x-ditapi-provider"] = apiContext.provider.name

    if (middlewareContext.user) {
      headers["x-ditapi-user-id"] = middlewareContext.user.id
      headers["x-ditapi-user-email"] = middlewareContext.user.email
    }

    return headers
  }

  private async getRequestBody(req: IncomingMessage): Promise<string | undefined> {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return undefined
    }

    return new Promise((resolve, reject) => {
      let body = ""
      req.on("data", (chunk) => {
        body += chunk.toString()
      })
      req.on("end", () => resolve(body))
      req.on("error", reject)
    })
  }

  private getClientIp(req: IncomingMessage): string {
    const forwarded = req.headers["x-forwarded-for"] as string
    if (forwarded) {
      return forwarded.split(",")[0].trim()
    }

    return (req.headers["x-real-ip"] as string) || req.socket?.remoteAddress || "127.0.0.1"
  }
}
