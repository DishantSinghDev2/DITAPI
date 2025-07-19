import { GatewayMiddleware, type ProcessedGatewayRequest, type MiddlewareResult } from "../core/gateway-middleware"
import type { GatewayLogger } from "../core/gateway-logger"
import type { GatewayMetrics } from "../core/gateway-metrics"
import { db } from "../../lib/database/connection"
import { apiUsageAnalytics } from "../../lib/database/schema"
import { eq, gte, and, sql } from "drizzle-orm"
import { getPricingPlanById } from "@/lib/database/pricing-queries"
import { getApiById } from "@/lib/database/api-queries"
import { kv } from "@vercel/kv" // Using Vercel KV for rate limiting

const RATE_LIMIT_WINDOW_SECONDS = 60 // 1 minute window

export class RateLimitMiddleware extends GatewayMiddleware {
  private logger: GatewayLogger
  private metrics: GatewayMetrics
  private rateLimitCache: Map<string, any> = new Map()

  constructor(logger: GatewayLogger) {
    super(logger)
    this.logger = logger
  }

  async handle(request: ProcessedGatewayRequest): Promise<MiddlewareResult> {
    this.logger.log("Running RateLimitMiddleware")

    if (!request.user || !request.api) {
      this.logger.warn("RateLimitMiddleware: User or API not available. Skipping rate limit.")
      return { request } // Cannot apply rate limit without user/API context
    }

    let rateLimitPerSecond = 0

    // Determine rate limit based on user's subscription plan
    if (request.userSubscription) {
      const pricingPlan = await getPricingPlanById(request.userSubscription.pricingPlanId)
      if (pricingPlan) {
        rateLimitPerSecond = pricingPlan.rate_limit_per_second
        this.logger.log(
          `Rate limit for user ${request.user.id} (plan ${pricingPlan.name}): ${rateLimitPerSecond} req/s`,
        )
      }
    } else {
      // If no active subscription, check if API has a free tier or default rate limit
      // For simplicity, let's assume a default low rate limit for un-subscribed users
      // or if the API has a free plan with a specific rate limit.
      const api = await getApiById(request.api.id)
      if (api) {
        const freePlan = (await getPricingPlanById(api.id))?.is_free // This needs to be fixed to get the actual free plan for the API
        if (freePlan) {
          // This logic needs to be refined to fetch the actual free plan's rate limit
          // For now, a hardcoded default for un-subscribed access
          rateLimitPerSecond = 1 // Very low default for un-subscribed access
          this.logger.log(`Rate limit for un-subscribed user on API ${api.name}: ${rateLimitPerSecond} req/s`)
        }
      }
    }

    if (rateLimitPerSecond <= 0) {
      this.logger.log("Rate limit is 0 or not configured. Skipping rate limit enforcement.")
      return { request } // No rate limit to enforce
    }

    const key = `rate_limit:${request.user.id}:${request.api.id}`
    const currentTimestamp = Math.floor(Date.now() / 1000) // Current time in seconds

    // Get the list of timestamps for requests made by this user for this API
    const requestTimestamps: number[] = await kv.lrange(key, 0, -1)

    // Filter out timestamps older than the window
    const relevantTimestamps = requestTimestamps.filter((ts) => currentTimestamp - ts < RATE_LIMIT_WINDOW_SECONDS)

    // Add the current request timestamp
    relevantTimestamps.push(currentTimestamp)

    // Check if the number of requests exceeds the limit within the window
    if (relevantTimestamps.length > rateLimitPerSecond) {
      this.logger.warn(`Rate limit exceeded for user ${request.user.id} on API ${request.api.name}`)
      return {
        request,
        response: {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "1", // Suggest retrying after 1 second
          },
          body: JSON.stringify({ message: "Too Many Requests: Rate limit exceeded" }),
        },
      }
    }

    // Update KV store with new timestamps, keeping only relevant ones
    await kv.del(key) // Clear old list
    if (relevantTimestamps.length > 0) {
      await kv.rpush(key, ...relevantTimestamps)
      await kv.expire(key, RATE_LIMIT_WINDOW_SECONDS) // Set expiration for the list
    }

    this.logger.log(
      `Rate limit check passed for user ${request.user.id} on API ${request.api.name}. Current requests: ${relevantTimestamps.length}/${rateLimitPerSecond}`,
    )
    return { request }
  }

  private async checkRateLimit(apiKeyId: string, plan: any) {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 1000) // 1 second window
    const limit = plan.rateLimitPerSecond || 10

    // Check cache first
    const cacheKey = `ratelimit:${apiKeyId}`
    const cached = this.rateLimitCache.get(cacheKey)

    if (cached && now.getTime() - cached.timestamp < 1000) {
      const allowed = cached.count < limit
      if (allowed) {
        cached.count++
      }

      return {
        allowed,
        limit,
        remaining: Math.max(0, limit - cached.count),
        reset: Math.ceil((cached.timestamp + 1000) / 1000),
        retryAfter: allowed ? null : 1,
      }
    }

    // Query database for current usage
    try {
      const usageResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(apiUsageAnalytics)
        .where(and(eq(apiUsageAnalytics.apiKeyId, apiKeyId), gte(apiUsageAnalytics.timestamp, windowStart)))

      const currentUsage = usageResult[0]?.count || 0
      const allowed = currentUsage < limit

      // Update cache
      this.rateLimitCache.set(cacheKey, {
        count: currentUsage + (allowed ? 1 : 0),
        timestamp: now.getTime(),
      })

      return {
        allowed,
        limit,
        remaining: Math.max(0, limit - currentUsage - (allowed ? 1 : 0)),
        reset: Math.ceil(now.getTime() / 1000) + 1,
        retryAfter: allowed ? null : 1,
      }
    } catch (error) {
      this.logger.error("Rate limit database error", { error: error.message })
      // Fail open
      return {
        allowed: true,
        limit,
        remaining: limit,
        reset: Math.ceil(now.getTime() / 1000) + 1,
      }
    }
  }
}
