import type { IncomingMessage } from "http"
import { GatewayMiddleware, type ProcessedGatewayRequest, type MiddlewareResult } from "../core/gateway-middleware"
import type { GatewayLogger } from "../core/gateway-logger"
import { db } from "../../lib/database/connection"
import { apiKeys, users, userApplications, apiSubscriptions, pricingPlans } from "../../lib/database/schema"
import { eq, and } from "drizzle-orm"
import { createHash } from "crypto"
import { getUserSession } from "@/app/session"

export class AuthenticationMiddleware extends GatewayMiddleware {
  private logger: GatewayLogger

  constructor(logger: GatewayLogger) {
    super(logger)
    this.logger = logger
  }

  async handle(request: ProcessedGatewayRequest): Promise<MiddlewareResult> {
    this.logger.log("Running AuthenticationMiddleware")

    // Check if the API requires authentication
    // This logic assumes a property on the API object indicating auth requirement
    // For simplicity, let's assume all APIs require authentication for now,
    // or that public APIs are handled by a different route/logic.
    // In a real system, `request.api` would have `auth_required: boolean` or similar.

    const session = await getUserSession()
    if (!session?.user) {
      this.logger.warn("Authentication failed: No active user session.")
      return {
        request,
        response: {
          status: 401,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Unauthorized: Authentication required" }),
        },
      }
    }

    // Attach user information to the request for subsequent middleware
    request.user = session.user
    this.logger.log(`Authentication successful for user: ${session.user.id}`)

    return { request }
  }

  private extractApiKey(req: IncomingMessage): string | null {
    // Check headers
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7)
    }

    // Check specific API key headers
    const rapidApiKey = req.headers["x-rapidapi-key"] as string
    if (rapidApiKey) return rapidApiKey

    const ditapiKey = req.headers["x-ditapi-key"] as string
    if (ditapiKey) return ditapiKey

    const apiKeyHeader = req.headers["x-api-key"] as string
    if (apiKeyHeader) return apiKeyHeader

    // Check query parameter
    const url = new URL(req.url || "", `http://${req.headers.host}`)
    const queryApiKey = url.searchParams.get("api_key")
    if (queryApiKey) return queryApiKey

    return null
  }

  private async validateApiKey(apiKey: string, apiId: string) {
    try {
      const keyHash = createHash("sha256").update(apiKey).digest("hex")
      const keyPrefix = apiKey.substring(0, 12)

      const result = await db
        .select({
          // API Key
          keyId: apiKeys.id,
          keyIsActive: apiKeys.isActive,
          keyExpiresAt: apiKeys.expiresAt,
          applicationId: apiKeys.applicationId,

          // User
          userId: users.id,
          userEmail: users.email,
          userName: users.username,
          userVerified: users.isVerified,

          // Subscription
          subscriptionId: apiSubscriptions.id,
          subscriptionStatus: apiSubscriptions.status,
          subscriptionPeriodEnd: apiSubscriptions.currentPeriodEnd,

          // Plan
          planId: pricingPlans.id,
          planName: pricingPlans.name,
          planRequestsPerMonth: pricingPlans.requestsPerMonth,
          planRateLimitPerSecond: pricingPlans.rateLimitPerSecond,
          planFeatures: pricingPlans.features,
        })
        .from(apiKeys)
        .innerJoin(userApplications, eq(apiKeys.applicationId, userApplications.id))
        .innerJoin(users, eq(userApplications.userId, users.id))
        .innerJoin(apiSubscriptions, and(eq(apiSubscriptions.userId, users.id), eq(apiSubscriptions.apiId, apiId)))
        .innerJoin(pricingPlans, eq(apiSubscriptions.planId, pricingPlans.id))
        .where(
          and(
            eq(apiKeys.keyHash, keyHash),
            eq(apiKeys.keyPrefix, keyPrefix),
            eq(apiKeys.isActive, true),
            eq(apiKeys.apiId, apiId),
            eq(apiSubscriptions.status, "active"),
          ),
        )
        .limit(1)

      if (!result.length) {
        return {
          valid: false,
          error: "Invalid or inactive API key",
          errorCode: "INVALID_API_KEY",
        }
      }

      const data = result[0]

      // Check key expiration
      if (data.keyExpiresAt && new Date() > data.keyExpiresAt) {
        return {
          valid: false,
          error: "API key has expired",
          errorCode: "EXPIRED_API_KEY",
        }
      }

      // Check subscription expiration
      if (data.subscriptionPeriodEnd && new Date() > data.subscriptionPeriodEnd) {
        return {
          valid: false,
          error: "Subscription has expired",
          errorCode: "EXPIRED_SUBSCRIPTION",
        }
      }

      return {
        valid: true,
        user: {
          id: data.userId,
          email: data.userEmail,
          username: data.userName,
          verified: data.userVerified,
        },
        subscription: {
          id: data.subscriptionId,
          status: data.subscriptionStatus,
          periodEnd: data.subscriptionPeriodEnd,
        },
        plan: {
          id: data.planId,
          name: data.planName,
          requestsPerMonth: data.planRequestsPerMonth,
          rateLimitPerSecond: data.planRateLimitPerSecond,
          features: data.planFeatures,
        },
        apiKey: {
          id: data.keyId,
          applicationId: data.applicationId,
        },
      }
    } catch (error) {
      this.logger.error("API key validation error", { error: error.message })
      return {
        valid: false,
        error: "Key validation failed",
        errorCode: "VALIDATION_ERROR",
      }
    }
  }
}
