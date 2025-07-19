import { db } from "@/lib/database/connection"
import { userApplications, apiKeys, apiSubscriptions, apiUsageAnalytics } from "@/lib/database/schema"
import { eq, and, desc, sql, count } from "drizzle-orm"
import type { UserApplication, ApiKey, ApiSubscription } from "@/types/api"

export async function getUserApplicationsFromDb(userId: string): Promise<UserApplication[]> {
  const applications = await db.query.userApplications.findMany({
    where: eq(userApplications.userId, userId),
    with: {
      apiKeys: true, // Eager load API keys for each application
    },
    orderBy: desc(userApplications.createdAt),
  })
  return applications
}

export async function createApplicationInDb(
  userId: string,
  data: Omit<UserApplication, "id" | "userId" | "createdAt" | "updatedAt" | "apiKeys">,
): Promise<UserApplication | null> {
  const [newApp] = await db
    .insert(userApplications)
    .values({
      ...data,
      userId: userId,
    })
    .returning()
  return newApp || null
}

export async function updateApplicationInDb(
  appId: string,
  data: Partial<Omit<UserApplication, "id" | "userId" | "createdAt" | "updatedAt" | "apiKeys">>,
): Promise<UserApplication | null> {
  const [updatedApp] = await db
    .update(userApplications)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(userApplications.id, appId))
    .returning()
  return updatedApp || null
}

export async function deleteApplicationInDb(appId: string): Promise<boolean> {
  const result = await db.delete(userApplications).where(eq(userApplications.id, appId))
  return result.rowCount > 0
}

export async function getApiKeysForApplicationFromDb(applicationId: string): Promise<ApiKey[]> {
  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.applicationId, applicationId),
    orderBy: desc(apiKeys.createdAt),
  })
  return keys
}

export async function getApiKeysForUserAndApi(userId: string, apiId: string): Promise<ApiKey[]> {
  const keys = await db
    .select()
    .from(apiKeys)
    .innerJoin(userApplications, eq(apiKeys.applicationId, userApplications.id))
    .where(and(eq(userApplications.userId, userId), eq(apiKeys.apiId, apiId), eq(apiKeys.isActive, true)))
    .orderBy(desc(apiKeys.createdAt))
  return keys.map((row) => row.api_keys)
}

export async function createApiKeyInDb(
  applicationId: string,
  apiId: string,
  keyName: string,
  keyHash: string,
  keyPrefix: string,
): Promise<ApiKey | null> {
  const [newKey] = await db
    .insert(apiKeys)
    .values({
      applicationId,
      apiId,
      name: keyName,
      keyHash,
      keyPrefix,
      isActive: true,
      expiresAt: null, // API keys typically don't expire by default
    })
    .returning()
  return newKey || null
}

export async function deleteApiKeyInDb(apiKeyId: string): Promise<boolean> {
  const result = await db.delete(apiKeys).where(eq(apiKeys.id, apiKeyId))
  return result.rowCount > 0
}

export async function getUserSubscriptionsFromDb(userId: string): Promise<ApiSubscription[]> {
  const subscriptions = await db.query.apiSubscriptions.findMany({
    where: eq(apiSubscriptions.userId, userId),
    with: {
      api: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
      pricingPlan: {
        columns: {
          id: true,
          name: true,
          priceMonthly: true,
        },
      },
      apiKeys: {
        columns: {
          id: true,
          keyPrefix: true,
          keyHash: true,
          name: true,
        },
      },
    },
    orderBy: desc(apiSubscriptions.createdAt),
  })
  return subscriptions as ApiSubscription[]
}

export async function cancelSubscriptionInDb(subscriptionId: string): Promise<ApiSubscription | null> {
  const [updatedSubscription] = await db
    .update(apiSubscriptions)
    .set({
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
      status: "cancelled", // Mark as cancelled immediately, but remains active until period end
    })
    .where(eq(apiSubscriptions.id, subscriptionId))
    .returning()
  return updatedSubscription || null
}

export async function getApiUsageForUser(
  userId: string,
  filters: { apiKeyId?: string; apiId?: string; interval?: "hour" | "day" | "month" },
) {
  const { apiKeyId, apiId, interval = "day" } = filters

  let groupByClause: any
  let timeFilter: any

  switch (interval) {
    case "hour":
      groupByClause = sql`date_trunc('hour', ${apiUsageAnalytics.timestamp})`
      timeFilter = sql`${apiUsageAnalytics.timestamp} >= NOW() - INTERVAL '24 hours'`
      break
    case "day":
      groupByClause = sql`date_trunc('day', ${apiUsageAnalytics.timestamp})`
      timeFilter = sql`${apiUsageAnalytics.timestamp} >= NOW() - INTERVAL '30 days'`
      break
    case "month":
      groupByClause = sql`date_trunc('month', ${apiUsageAnalytics.timestamp})`
      timeFilter = sql`${apiUsageAnalytics.timestamp} >= NOW() - INTERVAL '12 months'`
      break
  }

  let query = db
    .select({
      time: groupByClause,
      totalRequests: count(apiUsageAnalytics.id),
      avgResponseTime: sql<number>`AVG(${apiUsageAnalytics.responseTime})`,
      errorCount: count(sql`CASE WHEN ${apiUsageAnalytics.statusCode} >= 400 THEN 1 END`),
    })
    .from(apiUsageAnalytics)
    .innerJoin(apiKeys, eq(apiUsageAnalytics.apiKeyId, apiKeys.id))
    .innerJoin(userApplications, eq(apiKeys.applicationId, userApplications.id))
    .where(and(eq(userApplications.userId, userId), timeFilter))

  if (apiKeyId) {
    query = query.where(and(eq(apiKeys.id, apiKeyId)))
  } else if (apiId) {
    query = query.where(and(eq(apiKeys.apiId, apiId)))
  }

  const usageData = await query.groupBy(groupByClause).orderBy(groupByClause)

  return usageData
}
