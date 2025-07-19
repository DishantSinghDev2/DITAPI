// This file defines logic for exposing gateway metrics.
// In a production environment, this would be exposed via a dedicated endpoint
// (e.g., /metrics) for Prometheus or other monitoring systems to scrape.

import { GatewayMetrics } from "../core/gateway-metrics"
import { GatewayLogger } from "../core/gateway-logger"
import { db, sql, apiRequests } from "@/lib/database" // Import db, sql, and apiRequests

const logger = new GatewayLogger((process.env.GATEWAY_LOG_LEVEL as any) || "info")
const gatewayMetrics = new GatewayMetrics(logger)

export async function getPrometheusMetrics(): Promise<string> {
  let metrics = "# HELP gateway_requests_total Total number of requests processed by the gateway.\n"
  metrics += "# TYPE gateway_requests_total counter\n"
  metrics += "# HELP gateway_request_duration_seconds Latency of requests processed by the gateway.\n"
  metrics += "# TYPE gateway_request_duration_seconds histogram\n"
  metrics += "# HELP gateway_errors_total Total number of errors encountered by the gateway.\n"
  metrics += "# TYPE gateway_errors_total counter\n"

  // Fetch aggregated metrics from the database
  // This is a simplified example. In a real system, you'd aggregate more granular data.
  try {
    // Get overall platform stats
    const overallStats = await gatewayMetrics.getHourlyMetrics("all", 1) // Example: last hour for all APIs
    // This needs to be refined to get overall platform metrics, not just per API.
    // For simplicity, let's just get a count of all requests in the last hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const totalRequestsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiRequests)
      .where(sql`${apiRequests.timestamp} >= ${oneHourAgo}`)
    const totalErrorsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiRequests)
      .where(sql`${apiRequests.timestamp} >= ${oneHourAgo} AND ${apiRequests.statusCode} >= 400`)
    const totalLatencyResult = await db
      .select({ sum: sql<number>`sum(${apiRequests.latency})` })
      .from(apiRequests)
      .where(sql`${apiRequests.timestamp} >= ${oneHourAgo}`)

    const totalRequests = totalRequestsResult[0]?.count || 0
    const totalErrors = totalErrorsResult[0]?.count || 0
    const totalLatencySum = totalLatencyResult[0]?.sum || 0
    const avgLatency = totalRequests > 0 ? totalLatencySum / totalRequests / 1000 : 0 // Convert ms to seconds

    metrics += `gateway_requests_total{status="success"} ${totalRequests - totalErrors}\n`
    metrics += `gateway_requests_total{status="error"} ${totalErrors}\n`
    metrics += `gateway_errors_total ${totalErrors}\n`
    metrics += `gateway_request_duration_seconds_sum ${totalLatencySum / 1000}\n` // Sum of latencies in seconds
    metrics += `gateway_request_duration_seconds_count ${totalRequests}\n` // Total count of requests

    // Example: Per-API metrics
    const apis = await db.query.apis.findMany() // Fetch all APIs
    for (const api of apis) {
      const apiHourlyMetrics = await gatewayMetrics.getHourlyMetrics(api.id, 1) // Last hour for this API
      const apiTotalRequests = apiHourlyMetrics.reduce((sum, m) => sum + m.totalRequests, 0)
      const apiErrorCount = apiHourlyMetrics.reduce((sum, m) => sum + m.errorCount, 0)
      const apiAvgLatency = apiHourlyMetrics.reduce((sum, m) => sum + m.avgLatency, 0) / apiHourlyMetrics.length || 0

      metrics += `gateway_api_requests_total{api_id="${api.id}",api_slug="${api.slug}",status="success"} ${apiTotalRequests - apiErrorCount}\n`
      metrics += `gateway_api_requests_total{api_id="${api.id}",api_slug="${api.slug}",status="error"} ${apiErrorCount}\n`
      metrics += `gateway_api_request_duration_seconds_avg{api_id="${api.id}",api_slug="${api.slug}"} ${apiAvgLatency / 1000}\n`
    }
  } catch (error: any) {
    logger.error(`Failed to generate Prometheus metrics: ${error.message}`, error)
    // Return basic metrics or an error indicator if database is unreachable
    metrics += `gateway_metrics_generation_error 1\n`
  }

  return metrics
}
