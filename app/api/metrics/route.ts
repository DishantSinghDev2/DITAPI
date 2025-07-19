import { type NextRequest, NextResponse } from "next/server"
import { GatewayMetrics } from "@/gateway/core/gateway-metrics"
import { getPlatformAnalyticsFromDb } from "@/lib/database/admin-queries"

// This route exposes Prometheus-compatible metrics.
// In a real production setup, you might want to secure this endpoint
// or expose it only to internal monitoring systems.

const gatewayMetrics = new GatewayMetrics() // Re-initialize or get singleton instance

export async function GET(request: NextRequest) {
  try {
    const analytics = await getPlatformAnalyticsFromDb()
    const metrics = gatewayMetrics.getMetrics()

    // Prometheus exposition format
    let prometheusMetrics = ""
    for (const key in metrics) {
      prometheusMetrics += `# HELP ${key} ${key.replace(/([A-Z])/g, "_$1").toLowerCase()}\n`
      prometheusMetrics += `# TYPE ${key} gauge\n`
      prometheusMetrics += `${key} ${metrics[key]}\n`
    }

    prometheusMetrics += `
# HELP ditapi_total_apis Total number of APIs on the platform.
# TYPE ditapi_total_apis gauge
ditapi_total_apis ${analytics.totalApis}

# HELP ditapi_active_apis Total number of active APIs on the platform.
# TYPE ditapi_active_apis gauge
ditapi_active_apis ${analytics.activeApis}

# HELP ditapi_total_developers Total number of developers on the platform.
# TYPE ditapi_total_developers gauge
ditapi_total_developers ${analytics.totalDevelopers}

# HELP ditapi_active_developers Total number of active developers (last 30 days) on the platform.
# TYPE ditapi_active_developers gauge
ditapi_active_developers ${analytics.activeDevelopers}

# HELP ditapi_total_api_calls_30d Total API calls in the last 30 days.
# TYPE ditapi_total_api_calls_30d counter
ditapi_total_api_calls_30d ${analytics.totalApiCalls}

# HELP ditapi_avg_response_time_ms_30d Average API response time in milliseconds over the last 30 days.
# TYPE ditapi_avg_response_time_ms_30d gauge
ditapi_avg_response_time_ms_30d ${analytics.avgResponseTime}

# HELP ditapi_new_users_30d Number of new users registered in the last 30 days.
# TYPE ditapi_new_users_30d counter
ditapi_new_users_30d ${analytics.newUsersLast30Days}

# HELP ditapi_new_apis_30d Number of new APIs added in the last 30 days.
# TYPE ditapi_new_apis_30d counter
ditapi_new_apis_30d ${analytics.newApisLast30Days}
`

    // Add status code distribution
    analytics.statusCodeDistribution.forEach((item) => {
      prometheusMetrics += `
# HELP ditapi_api_status_code_total Total API calls by status code in the last 30 days.
# TYPE ditapi_api_status_code_total counter
ditapi_api_status_code_total{status_code="${item.statusCode}"} ${item.count}
`
    })

    return new NextResponse(prometheusMetrics, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error generating metrics:", error)
    return NextResponse.json({ error: "Failed to generate metrics" }, { status: 500 })
  }
}
