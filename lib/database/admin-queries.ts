import { db } from "@/lib/database/connection"
import { apis, users, providers, apiUsageAnalytics } from "@/lib/database/schema"
import { eq, desc, count, sql } from "drizzle-orm"
import type { User, Api, Provider } from "@/types/api"

// This file is now deprecated as all queries are consolidated into production-queries.ts
// This file is kept for reference but should not be used.

export async function getPendingApisFromDb(): Promise<Api[]> {
  const result = await db.query.apis.findMany({
    where: eq(apis.status, "pending"),
    with: {
      provider: {
        columns: {
          name: true,
        },
      },
    },
  })
  return result as Api[]
}

export async function updateApiStatusInDb(
  apiId: string,
  status: Api["status"],
  isPublic: boolean,
): Promise<Api | null> {
  const [updatedApi] = await db
    .update(apis)
    .set({
      status: status,
      isPublic: isPublic,
      updatedAt: new Date(),
    })
    .where(eq(apis.id, apiId))
    .returning()
  return updatedApi || null
}

export async function deleteApiInDb(apiId: string): Promise<boolean> {
  const result = await db.delete(apis).where(eq(apis.id, apiId))
  return result.rowCount > 0
}

export async function getUsersFromDb(): Promise<User[]> {
  const result = await db.query.users.findMany({
    orderBy: desc(users.createdAt),
  })
  return result
}

export async function updateUserRoleInDb(userId: string, role: User["role"]): Promise<User | null> {
  const [updatedUser] = await db
    .update(users)
    .set({
      role: role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()
  return updatedUser || null
}

export async function deleteUserInDb(userId: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.id, userId))
  return result.rowCount > 0
}

export async function getProvidersFromDb(): Promise<Provider[]> {
  const result = await db.query.providers.findMany({
    orderBy: desc(providers.createdAt),
  })
  return result
}

export async function updateProviderStatusInDb(providerId: string, isVerified: boolean): Promise<Provider | null> {
  const [updatedProvider] = await db
    .update(providers)
    .set({
      isVerified: isVerified,
      updatedAt: new Date(),
    })
    .where(eq(providers.id, providerId))
    .returning()
  return updatedProvider || null
}

export async function deleteProviderInDb(providerId: string): Promise<boolean> {
  const result = await db.delete(providers).where(eq(providers.id, providerId))
  return result.rowCount > 0
}

export async function getPlatformAnalyticsFromDb() {
  const thirtyDaysAgo = sql`NOW() - INTERVAL '30 days'`

  const [apiStats] = await db
    .select({
      totalApis: count(apis.id),
      activeApis: count(sql`CASE WHEN ${apis.status} = 'active' THEN 1 END`),
      newApisLast30Days: count(sql`CASE WHEN ${apis.createdAt} >= ${thirtyDaysAgo} THEN 1 END`),
    })
    .from(apis)

  const [userStats] = await db
    .select({
      totalDevelopers: count(users.id),
      activeDevelopers: count(sql`CASE WHEN ${users.lastLogin} >= ${thirtyDaysAgo} THEN 1 END`),
      newUsersLast30Days: count(sql`CASE WHEN ${users.createdAt} >= ${thirtyDaysAgo} THEN 1 END`),
    })
    .from(users)
    .where(eq(users.role, "developer"))

  const [usageStats] = await db
    .select({
      totalApiCalls: count(apiUsageAnalytics.id),
      avgResponseTime: sql<number>`AVG(${apiUsageAnalytics.responseTime})`,
    })
    .from(apiUsageAnalytics)
    .where(sql`${apiUsageAnalytics.timestamp} >= ${thirtyDaysAgo}`)

  const dailyApiCalls = await db
    .select({
      date: sql<string>`TO_CHAR(${apiUsageAnalytics.timestamp}, 'YYYY-MM-DD')`,
      count: count(apiUsageAnalytics.id),
    })
    .from(apiUsageAnalytics)
    .where(sql`${apiUsageAnalytics.timestamp} >= ${thirtyDaysAgo}`)
    .groupBy(sql`TO_CHAR(${apiUsageAnalytics.timestamp}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${apiUsageAnalytics.timestamp}, 'YYYY-MM-DD')`)

  const statusCodeDistribution = await db
    .select({
      statusCode: apiUsageAnalytics.statusCode,
      count: count(apiUsageAnalytics.id),
    })
    .from(apiUsageAnalytics)
    .where(sql`${apiUsageAnalytics.timestamp} >= ${thirtyDaysAgo}`)
    .groupBy(apiUsageAnalytics.statusCode)
    .orderBy(apiUsageAnalytics.statusCode)

  return {
    totalApis: apiStats?.totalApis || 0,
    activeApis: apiStats?.activeApis || 0,
    newApisLast30Days: apiStats?.newApisLast30Days || 0,
    totalDevelopers: userStats?.totalDevelopers || 0,
    activeDevelopers: userStats?.activeDevelopers || 0,
    newUsersLast30Days: userStats?.newUsersLast30Days || 0,
    totalApiCalls: usageStats?.totalApiCalls || 0,
    avgResponseTime: usageStats?.avgResponseTime || 0,
    dailyApiCalls: dailyApiCalls,
    statusCodeDistribution: statusCodeDistribution,
  }
}
