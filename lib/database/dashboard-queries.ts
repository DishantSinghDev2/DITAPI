import { db } from "./connection"
import { users, apis, providers, applications, userApiKeys, subscriptions, apiUsage, apiRequests } from "./schema"
import { eq, desc, count, sum, avg, and, gte, sql } from "drizzle-orm"
import type {
  DashboardData,
  PlatformStats,
  AdminDashboardData,
  User,
  API,
  APIRequest,
  SubscriptionWithDetails,
} from "@/types/database"

export async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    // Get user's subscriptions with API details
    const userSubscriptions = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        api: {
          id: apis.id,
          name: apis.name,
          slug: apis.slug,
          description: apis.description,
          rating: apis.rating,
          status: apis.status,
        },
        pricingPlan: {
          id: subscriptions.pricingPlanId,
          name: sql<string>`'Basic'`, // Placeholder
          requestsPerMonth: sql<number>`1000`, // Placeholder
        },
      })
      .from(subscriptions)
      .innerJoin(apis, eq(subscriptions.apiId, apis.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))

    // Get usage stats for user's APIs
    const usageStats = await db
      .select({
        totalRequests: sum(apiUsage.requests),
        totalErrors: sum(apiUsage.errors),
        dataTransferred: sum(apiUsage.dataTransferred),
      })
      .from(apiUsage)
      .where(eq(apiUsage.userId, userId))
      .then(
        (result) =>
          result[0] || {
            totalRequests: 0,
            totalErrors: 0,
            dataTransferred: 0,
          },
      )

    // Get average latency from recent requests
    const latencyStats = await db
      .select({
        averageLatency: avg(apiRequests.latency),
      })
      .from(apiRequests)
      .where(
        and(eq(apiRequests.userId, userId), gte(apiRequests.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000))),
      )
      .then((result) => result[0]?.averageLatency || 0)

    // Get recent API requests
    const recentRequests = await db
      .select({
        id: apiRequests.id,
        method: apiRequests.method,
        path: apiRequests.path,
        statusCode: apiRequests.statusCode,
        latency: apiRequests.latency,
        timestamp: apiRequests.timestamp,
        apiId: apiRequests.apiId,
        userId: apiRequests.userId,
      })
      .from(apiRequests)
      .where(eq(apiRequests.userId, userId))
      .orderBy(desc(apiRequests.timestamp))
      .limit(10)

    // Get top APIs by request count
    const topApis = await db
      .select({
        id: apis.id,
        name: apis.name,
        slug: apis.slug,
        description: apis.description,
        rating: apis.rating,
        status: apis.status,
        requestCount: count(apiRequests.id),
      })
      .from(apis)
      .leftJoin(apiRequests, and(eq(apiRequests.apiId, apis.id), eq(apiRequests.userId, userId)))
      .groupBy(apis.id)
      .orderBy(desc(count(apiRequests.id)))
      .limit(5)

    return {
      stats: {
        totalRequests: Number(usageStats.totalRequests) || 0,
        totalErrors: Number(usageStats.totalErrors) || 0,
        averageLatency: Number(latencyStats) || 0,
        dataTransferred: Number(usageStats.dataTransferred) || 0,
      },
      recentRequests: recentRequests as APIRequest[],
      topApis: topApis.map((api) => ({
        ...api,
        requestCount: Number(api.requestCount) || 0,
      })) as (API & { requestCount: number })[],
      subscriptions: userSubscriptions as SubscriptionWithDetails[],
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw new Error("Failed to fetch dashboard data")
  }
}

export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const [totalApis, totalProviders, totalUsers, totalRequestsLast24h] = await Promise.all([
      db
        .select({ count: count() })
        .from(apis)
        .then((result) => result[0]?.count || 0),
      db
        .select({ count: count() })
        .from(providers)
        .then((result) => result[0]?.count || 0),
      db
        .select({ count: count() })
        .from(users)
        .then((result) => result[0]?.count || 0),
      db
        .select({ count: count() })
        .from(apiRequests)
        .where(gte(apiRequests.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)))
        .then((result) => result[0]?.count || 0),
    ])

    return {
      totalApis: Number(totalApis),
      totalProviders: Number(totalProviders),
      totalUsers: Number(totalUsers),
      totalRequestsLast24h: Number(totalRequestsLast24h),
    }
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    throw new Error("Failed to fetch platform stats")
  }
}

export async function getAdminDashboardData(): Promise<Omit<AdminDashboardData, "adminUser">> {
  try {
    // Get platform stats
    const platformStats = await getPlatformStats()

    // Get top APIs by usage
    const topApisByUsage = await db
      .select({
        id: apis.id,
        name: apis.name,
        slug: apis.slug,
        description: apis.description,
        rating: apis.rating,
        status: apis.status,
        usageCount: sum(apiUsage.requests),
      })
      .from(apis)
      .leftJoin(apiUsage, eq(apiUsage.apiId, apis.id))
      .groupBy(apis.id)
      .orderBy(desc(sum(apiUsage.requests)))
      .limit(10)

    // Get recent signups
    const recentSignups = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10)

    return {
      platformStats,
      topApisByUsage: topApisByUsage.map((api) => ({
        ...api,
        usageCount: Number(api.usageCount) || 0,
      })) as (API & { usageCount: number })[],
      recentSignups: recentSignups as User[],
    }
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error)
    throw new Error("Failed to fetch admin dashboard data")
  }
}

export async function getUserApplications(userId: string) {
  try {
    return await db
      .select({
        id: applications.id,
        name: applications.name,
        description: applications.description,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt))
  } catch (error) {
    console.error("Error fetching user applications:", error)
    throw new Error("Failed to fetch user applications")
  }
}

export async function getUserApiKeys(userId: string) {
  try {
    return await db
      .select({
        id: userApiKeys.id,
        name: userApiKeys.name,
        keyValue: userApiKeys.keyValue,
        isActive: userApiKeys.isActive,
        createdAt: userApiKeys.createdAt,
        expiresAt: userApiKeys.expiresAt,
        lastUsedAt: userApiKeys.lastUsedAt,
        api: {
          id: apis.id,
          name: apis.name,
          slug: apis.slug,
        },
        application: {
          id: applications.id,
          name: applications.name,
        },
      })
      .from(userApiKeys)
      .innerJoin(apis, eq(userApiKeys.apiId, apis.id))
      .innerJoin(applications, eq(userApiKeys.applicationId, applications.id))
      .where(eq(userApiKeys.createdByUserId, userId))
      .orderBy(desc(userApiKeys.createdAt))
  } catch (error) {
    console.error("Error fetching user API keys:", error)
    throw new Error("Failed to fetch user API keys")
  }
}
