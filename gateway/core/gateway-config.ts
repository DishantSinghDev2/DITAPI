export class GatewayConfig {
  public readonly gatewayBasePath: string
  public readonly defaultApiVersion: string
  public readonly enableRateLimiting: boolean
  public readonly enableQuotaEnforcement: boolean
  public readonly enableAuthentication: boolean
  public readonly enableAnalytics: boolean
  public readonly enableCors: boolean
  public readonly logLevel: "debug" | "info" | "warn" | "error" | "none"

  constructor() {
    // Base path for the gateway API route in Next.js
    // e.g., if your route is app/api/gateway/[...path]/route.ts, this would be /api/gateway
    this.gatewayBasePath = process.env.NEXT_PUBLIC_DITAPI_SUBDOMAIN_BASE ? `/api/gateway/` : `/api/gateway/`

    // Default API version to use if not specified by the client or API definition
    this.defaultApiVersion = process.env.GATEWAY_DEFAULT_API_VERSION || "v1"

    // Feature toggles
    this.enableRateLimiting = process.env.GATEWAY_ENABLE_RATE_LIMITING === "true"
    this.enableQuotaEnforcement = process.env.GATEWAY_ENABLE_QUOTA_ENFORCEMENT === "true"
    this.enableAuthentication = process.env.GATEWAY_ENABLE_AUTHENTICATION === "true"
    this.enableAnalytics = process.env.GATEWAY_ENABLE_ANALYTICS === "true"
    this.enableCors = process.env.GATEWAY_ENABLE_CORS === "true"

    // Logging level for the gateway
    this.logLevel = (process.env.GATEWAY_LOG_LEVEL as "debug" | "info" | "warn" | "error" | "none") || "info"

    // Validate essential configurations
    if (!this.gatewayBasePath) {
      throw new Error("GATEWAY_BASE_PATH is not configured.")
    }
  }
}
