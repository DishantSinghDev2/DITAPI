import { db } from "@/lib/database/connection"
import { apiUsageAnalytics, apiKeys, apis } from "@/lib/database/schema"
import { eq, sql, count, and, desc } from "drizzle-orm"

export async function getRealtimeApiUsage(apiId: string, interval: "hour" | "day" | "month" = "hour") {
  const now = new Date()
  let groupByClause: any
  let timeFilter: any

  switch (interval) {
    case "hour":
      groupByClause = sql`date_trunc('hour', ${apiUsageAnalytics.timestamp})`
      timeFilter = sql`${apiUsageAnalytics.timestamp} >= ${sql`NOW() - INTERVAL '24 hours'`}`
      break
    case "day":
      groupByClause = sql`date_trunc('day', ${apiUsageAnalytics.timestamp})`
      timeFilter = sql`${apiUsageAnalytics.timestamp} >= ${sql`NOW() - INTERVAL '30 days'`}`
      break
    case "month":
      groupByClause = sql`date_trunc('month', ${apiUsageAnalytics.timestamp})`
      timeFilter = sql`${apiUsageAnalytics.timestamp} >= ${sql`NOW() - INTERVAL '12 months'`}`
      break
  }

  const usageData = await db
    .select({
      time: groupByClause,
      totalRequests: count(apiUsageAnalytics.id),
      avgResponseTime: sql<number>`AVG(${apiUsageAnalytics.responseTime})`,
      errorCount: count(sql`CASE WHEN ${apiUsageAnalytics.statusCode} >= 400 THEN 1 END`),
    })
    .from(apiUsageAnalytics)
    .innerJoin(apiKeys, eq(apiUsageAnalytics.apiKeyId, apiKeys.id))
    .where(and(eq(apiKeys.apiId, apiId), timeFilter))
    .groupBy(groupByClause)
    .orderBy(groupByClause)

  return usageData
}

export async function getApiHealthMetrics(apiId: string) {
  const [metrics] = await db
    .select({
      totalRequests: count(apiUsageAnalytics.id),
      avgResponseTime: sql<number>`AVG(${apiUsageAnalytics.responseTime})`,
      errorRate: sql<number>`CAST(COUNT(CASE WHEN ${apiUsageAnalytics.statusCode} >= 400 THEN 1 END) AS DECIMAL) * 100 / COUNT(${apiUsageAnalytics.id})`,
      lastHourRequests: count(sql`CASE WHEN ${apiUsageAnalytics.timestamp} >= NOW() - INTERVAL '1 hour' THEN 1 END`),
    })
    .from(apiUsageAnalytics)
    .innerJoin(apiKeys, eq(apiUsageAnalytics.apiKeyId, apiKeys.id))
    .where(eq(apiKeys.apiId, apiId))

  return {
    totalRequests: metrics?.totalRequests || 0,
    avgResponseTime: metrics?.avgResponseTime || 0,
    errorRate: metrics?.errorRate || 0,
    lastHourRequests: metrics?.lastHourRequests || 0,
  }
}

export async function getTopApisByUsage(limit = 5) {
  const topApis = await db
    .select({
      apiId: apis.id,
      apiName: apis.name,
      totalCalls: count(apiUsageAnalytics.id),
    })
    .from(apiUsageAnalytics)
    .innerJoin(apiKeys, eq(apiUsageAnalytics.apiKeyId, apiKeys.id))
    .innerJoin(apis, eq(apiKeys.apiId, apis.id))
    .groupBy(apis.id, apis.name)
    .orderBy(desc(sql`totalCalls`))
    .limit(limit)

  return topApis
}
