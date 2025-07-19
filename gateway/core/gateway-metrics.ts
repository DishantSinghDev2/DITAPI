import { db } from "@/lib/database/connection"
import { apiRequests, apiUsage } from "@/lib/database/schema"
import { sql } from "drizzle-orm"
import type { GatewayLogger } from "./gateway-logger"

export class GatewayMetrics {
  private logger: GatewayLogger

  constructor(logger: GatewayLogger) {
    this.logger = logger
  }

  public async recordRequest(
    apiId: string,
    userId: string,
    method: string,
    path: string,
    statusCode: number,
    latency: number, // in milliseconds
    requestSize: number, // in bytes
    responseSize: number, // in bytes
  ): Promise<void> {
    try {
      await db.insert(apiRequests).values({
        apiId: apiId,
        userId: userId,
        method: method,
        path: path,
        statusCode: statusCode,
        latency: latency,
        requestSize: requestSize,
        responseSize: responseSize,
        timestamp: new Date(),
      })
      this.logger.debug(`Recorded API request for API ${apiId} by user ${userId}`)

      // Update aggregated usage metrics
      await db
        .insert(apiUsage)
        .values({
          apiId: apiId,
          userId: userId,
          requests: 1,
          dataTransferred: requestSize + responseSize,
          errors: statusCode >= 400 ? 1 : 0,
          timestamp: new Date(),
        })
        .onConflictDoUpdate({
          target: [apiUsage.apiId, apiUsage.userId, apiUsage.timestamp], // Conflict on API, user, and same timestamp (e.g., same minute/hour)
          set: {
            requests: sql`${apiUsage.requests} + 1`,
            dataTransferred: sql`${apiUsage.dataTransferred} + ${requestSize + responseSize}`,
            errors: sql`${apiUsage.errors} + ${statusCode >= 400 ? 1 : 0}`,
          },
        })

      this.logger.debug(`Updated API usage for API ${apiId} by user ${userId}`)
    } catch (error: any) {
      this.logger.error(`Failed to record metrics: ${error.message}`, error)
    }
  }

  // Potentially add methods to retrieve metrics for monitoring endpoints
  public async getHourlyMetrics(apiId: string, hours = 24): Promise<any[]> {
    const twentyFourHoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000)
    const result = await db
      .select({
        hour: sql<string>`to_char(date_trunc('hour', ${apiRequests.timestamp}), 'YYYY-MM-DD HH24:00')`,
        totalRequests: sql<number>`count(${apiRequests.id})`,
        avgLatency: sql<number>`avg(${apiRequests.latency})`,
        errorCount: sql<number>`count(${apiRequests.id}) filter (where ${apiRequests.statusCode} >= 400)`,
      })
      .from(apiRequests)
      .where(sql`${apiRequests.apiId} = ${apiId} AND ${apiRequests.timestamp} >= ${twentyFourHoursAgo}`)
      .groupBy(sql`date_trunc('hour', ${apiRequests.timestamp})`)
      .orderBy(sql`date_trunc('hour', ${apiRequests.timestamp})`)

    return result
  }
}
