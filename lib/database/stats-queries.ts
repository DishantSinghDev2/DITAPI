import { db } from "./connection"
import { apiUsage, apiRequests, users, apis, providers } from "./schema"
import { eq, sum, count, sql, desc, and, gte, lt } from "drizzle-orm"
import type { APIUsage, API } from "@/types/database"

export async function getDailyApiUsage(apiId: string, date: Date): Promise<APIUsage[]> {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0))
  const endOfDay = new Date(date.setHours(23, 59, 59, 999))

  const usage = await db
    .select({
      apiId: apiUsage.apiId,
      timestamp: apiUsage.timestamp,
      requests: apiUsage.requests,
      dataTransferred: apiUsage.dataTransferred,
      errors: apiUsage.errors,
    })
    .from(apiUsage)
    .where(and(eq(apiUsage.apiId, apiId), gte(apiUsage.timestamp, startOfDay), lt(apiUsage.timestamp, endOfDay)))
    .orderBy(apiUsage.timestamp)

  return usage
}

export async function getTotalRequestsForApi(apiId: string): Promise<number> {
  const result = await db
    .select({ totalRequests: sum(apiUsage.requests) })
    .from(apiUsage)
    .where(eq(apiUsage.apiId, apiId))

  return Number.parseInt(result[0]?.totalRequests || "0")
}

export async function getApiLatencyMetrics(
  apiId: string,
): Promise<{ avgLatency: number | null; maxLatency: number | null }> {
  const result = await db
    .select({
      avgLatency: sql<number>`avg(${apiRequests.latency})`,
      maxLatency: sql<number>`max(${apiRequests.latency})`,
    })
    .from(apiRequests)
    .where(eq(apiRequests.apiId, apiId))

  return {
    avgLatency: result[0]?.avgLatency || null,
    maxLatency: result[0]?.maxLatency || null,
  }
}

export async function getApiErrorRate(apiId: string): Promise<number> {
  const totalRequestsResult = await db.select({ count: count() }).from(apiRequests).where(eq(apiRequests.apiId, apiId))

  const errorRequestsResult = await db
    .select({ count: count() })
    .from(apiRequests)
    .where(and(eq(apiRequests.apiId, apiId), sql`${apiRequests.statusCode} >= 400`))

  const total = totalRequestsResult[0]?.count || 0
  const errors = errorRequestsResult[0]?.count || 0

  return total > 0 ? (errors / total) * 100 : 0
}

export async function getTopApisByUsage(limit = 5): Promise<API[]> {
  const result = await db
    .select({
      api: apis,
      totalRequests: sum(apiUsage.requests).as("totalRequests"),
    })
    .from(apiUsage)
    .innerJoin(apis, eq(apiUsage.apiId, apis.id))
    .groupBy(apis.id)
    .orderBy(desc(sql`totalRequests`))
    .limit(limit)

  return result.map((row) => ({ ...row.api, totalRequests: Number.parseInt(row.totalRequests || "0") }))
}

export async function getPlatformOverviewStats(): Promise<{
  totalApis: number
  totalProviders: number
  totalUsers: number
  totalRequestsLast24h: number
}> {
  const totalApisResult = await db.select({ count: count() }).from(apis)
  const totalProvidersResult = await db.select({ count: count() }).from(providers)
  const totalUsersResult = await db.select({ count: count() }).from(users)

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const totalRequestsLast24hResult = await db
    .select({ totalRequests: sum(apiUsage.requests) })
    .from(apiUsage)
    .where(gte(apiUsage.timestamp, twentyFourHoursAgo))

  return {
    totalApis: totalApisResult[0]?.count || 0,
    totalProviders: totalProvidersResult[0]?.count || 0,
    totalUsers: totalUsersResult[0]?.count || 0,
    totalRequestsLast24h: Number.parseInt(totalRequestsLast24hResult[0]?.totalRequests || "0"),
  }
}

export async function getApiUsageByTime(
  apiId: string,
  interval: "hour" | "day" | "month",
  startDate: Date,
  endDate: Date,
): Promise<any[]> {
  let groupByColumn
  let dateFormat

  switch (interval) {
    case "hour":
      groupByColumn = sql`date_trunc('hour', ${apiUsage.timestamp})`
      dateFormat = "YYYY-MM-DD HH24:00"
      break
    case "day":
      groupByColumn = sql`date_trunc('day', ${apiUsage.timestamp})`
      dateFormat = "YYYY-MM-DD"
      break
    case "month":
      groupByColumn = sql`date_trunc('month', ${apiUsage.timestamp})`
      dateFormat = "YYYY-MM"
      break
    default:
      throw new Error("Invalid interval")
  }

  const result = await db
    .select({
      time: sql<string>`to_char(${groupByColumn}, ${dateFormat})`,
      requests: sum(apiUsage.requests).as("requests"),
      errors: sum(apiUsage.errors).as("errors"),
      dataTransferred: sum(apiUsage.dataTransferred).as("dataTransferred"),
    })
    .from(apiUsage)
    .where(and(eq(apiUsage.apiId, apiId), gte(apiUsage.timestamp, startDate), lt(apiUsage.timestamp, endDate)))
    .groupBy(groupByColumn)
    .orderBy(groupByColumn)

  return result.map((row) => ({
    time: row.time,
    requests: Number.parseInt(row.requests || "0"),
    errors: Number.parseInt(row.errors || "0"),
    dataTransferred: Number.parseFloat(row.dataTransferred || "0"),
  }))
}

export async function getUserApiUsage(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
  const result = await db
    .select({
      apiId: apiUsage.apiId,
      apiName: apis.name,
      requests: sum(apiUsage.requests).as("requests"),
      errors: sum(apiUsage.errors).as("errors"),
      dataTransferred: sum(apiUsage.dataTransferred).as("dataTransferred"),
    })
    .from(apiUsage)
    .innerJoin(apis, eq(apiUsage.apiId, apis.id))
    .where(and(eq(apiUsage.userId, userId), gte(apiUsage.timestamp, startDate), lt(apiUsage.timestamp, endDate)))
    .groupBy(apiUsage.apiId, apis.name)
    .orderBy(desc(sql`requests`))

  return result.map((row) => ({
    apiId: row.apiId,
    apiName: row.apiName,
    requests: Number.parseInt(row.requests || "0"),
    errors: Number.parseInt(row.errors || "0"),
    dataTransferred: Number.parseFloat(row.dataTransferred || "0"),
  }))
}
