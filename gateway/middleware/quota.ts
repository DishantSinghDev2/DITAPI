import { GatewayMiddleware, type ProcessedGatewayRequest, type MiddlewareResult } from "../core/gateway-middleware"
import type { GatewayLogger } from "../core/gateway-logger"
import { getPricingPlanById } from "@/lib/database/pricing-queries"
import { getApiUsageByTime } from "@/lib/database/stats-queries"
import { kv } from "@vercel/kv" // Using Vercel KV for quota tracking

export class QuotaMiddleware extends GatewayMiddleware {
  constructor(logger: GatewayLogger) {
    super(logger)
  }

  async handle(request: ProcessedGatewayRequest): Promise<MiddlewareResult> {
    this.logger.log("Running QuotaMiddleware")

    if (!request.user || !request.api || !request.userSubscription) {
      this.logger.warn("QuotaMiddleware: User, API, or Subscription not available. Skipping quota check.")
      return { request } // Cannot apply quota without full context
    }

    const pricingPlan = await getPricingPlanById(request.userSubscription.pricingPlanId)
    if (!pricingPlan) {
      this.logger.warn(
        `QuotaMiddleware: Pricing plan not found for subscription ${request.userSubscription.id}. Skipping quota check.`,
      )
      return { request }
    }

    const requestsPerMonthLimit = pricingPlan.requests_per_month

    if (requestsPerMonthLimit <= 0) {
      this.logger.log("Quota limit is 0 or not configured. Skipping quota enforcement.")
      return { request } // No quota to enforce
    }

    // Calculate current month's usage
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Fetch current usage from database (or a cached value if available)
    // For production, consider a more efficient way to get current month's usage,
    // e.g., a daily cron job to aggregate and store in KV, or direct KV increments.
    // For this example, we'll fetch from the database for simplicity, but note performance implications.
    const usageStats = await getApiUsageByTime(request.api.id, "month", startOfMonth, endOfMonth)
    const currentMonthRequests = usageStats.reduce((sum, stat) => sum + stat.requests, 0)

    // Alternatively, use KV for real-time incrementing:
    const quotaKey = `quota:${request.user.id}:${request.api.id}:${now.getFullYear()}-${now.getMonth()}`
    const currentRequests = await kv.incr(quotaKey) // Increment and get current count
    await kv.expireat(quotaKey, Math.floor(endOfMonth.getTime() / 1000)) // Ensure it expires at month end

    if (currentRequests > requestsPerMonthLimit) {
      this.logger.warn(
        `Quota exceeded for user ${request.user.id} on API ${request.api.name}. Current: ${currentRequests}, Limit: ${requestsPerMonthLimit}`,
      )
      return {
        request,
        response: {
          status: 403,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Forbidden: Monthly quota exceeded" }),
        },
      }
    }

    this.logger.log(
      `Quota check passed for user ${request.user.id} on API ${request.api.name}. Current: ${currentRequests}/${requestsPerMonthLimit}`,
    )
    return { request }
  }
}
