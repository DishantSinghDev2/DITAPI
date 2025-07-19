import { type NextRequest, NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/database/connection"
import { sql } from "sql-template-tag"
import { db } from "@/lib/database/connection"

export async function GET(request: NextRequest) {
  const healthStatus: { [key: string]: string } = {}
  let overallStatus = 200

  // Database Health Check
  const dbConnected = await checkDatabaseConnection()
  if (dbConnected) {
    healthStatus.database = "OK"
  } else {
    healthStatus.database = "DOWN"
    overallStatus = 500
  }

  // System Health Check
  try {
    // Check database connectivity
    await db.execute(sql`SELECT 1`)

    // Check system health
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    healthStatus.status = "healthy"
    healthStatus.timestamp = new Date().toISOString()
    healthStatus.version = "1.0.0"
    healthStatus.uptime = `${Math.floor(uptime / 60)} minutes`
    healthStatus.memory = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    }
    healthStatus.gateway = "operational"
  } catch (error) {
    healthStatus.status = "unhealthy"
    healthStatus.error = error instanceof Error ? error.message : "Unknown error"
    healthStatus.timestamp = new Date().toISOString()
    overallStatus = 503
  }

  if (overallStatus === 200) {
    return NextResponse.json({ status: "OK", ...healthStatus }, { status: 200 })
  } else {
    return NextResponse.json({ status: "DEGRADED", ...healthStatus }, { status: overallStatus })
  }
}
