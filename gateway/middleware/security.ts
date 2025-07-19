import { GatewayMiddleware, type ProcessedGatewayRequest, type MiddlewareResult } from "../core/gateway-middleware"
import type { GatewayLogger } from "../core/gateway-logger"

export class SecurityMiddleware extends GatewayMiddleware {
  constructor(logger: GatewayLogger) {
    super(logger)
  }

  async handle(request: ProcessedGatewayRequest): Promise<MiddlewareResult> {
    this.logger.log("Running SecurityMiddleware")

    // 1. Input Validation (basic example)
    // Prevent common attacks like SQL injection or XSS in query parameters or headers
    const url = new URL(request.url)
    for (const [key, value] of url.searchParams.entries()) {
      if (this.containsMaliciousContent(value)) {
        this.logger.warn(`Security alert: Malicious content detected in query param '${key}'`)
        return {
          request,
          response: {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Bad Request: Malicious content detected" }),
          },
        }
      }
    }

    for (const [key, value] of Object.entries(request.headers)) {
      if (this.containsMaliciousContent(value)) {
        this.logger.warn(`Security alert: Malicious content detected in header '${key}'`)
        return {
          request,
          response: {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Bad Request: Malicious content detected" }),
          },
        }
      }
    }

    // 2. IP Whitelisting/Blacklisting (example)
    // In a real scenario, these lists would be dynamic and managed in a database
    const blacklistedIPs = ["192.168.1.100", "10.0.0.5"]
    if (blacklistedIPs.includes(request.ip)) {
      this.logger.warn(`Security alert: Request from blacklisted IP: ${request.ip}`)
      return {
        request,
        response: {
          status: 403,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Forbidden: Access denied from this IP address" }),
        },
      }
    }

    // 3. Header Sanitization (already partly done in ResponseProcessor, but can be done here for request headers)
    // Ensure no sensitive internal headers are passed from client to target API
    // (e.g., internal authentication tokens if client somehow sends them)

    this.logger.log("SecurityMiddleware: All checks passed.")
    return { request }
  }

  private containsMaliciousContent(input: string): boolean {
    // Simple regex for common injection patterns. Not exhaustive.
    const patterns = [
      /<script>/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i, // XSS
      /SELECT .* FROM/i,
      /UNION ALL SELECT/i,
      /DROP TABLE/i, // SQL Injection
      /&lt;script&gt;/i,
      /%3Cscript%3E/i, // HTML encoded XSS
    ]
    return patterns.some((pattern) => pattern.test(input))
  }
}
