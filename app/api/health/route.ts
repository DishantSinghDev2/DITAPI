import { type NextRequest, NextResponse } from "next/server"
import { checkDatabaseConnection, pool } from "@/lib/database/connection"

export async function GET(request: NextRequest) {
  const healthStatus: Record<string, any> = {}
  let overallStatus = 200

  // Check DB connection via helper
  const dbConnected = await checkDatabaseConnection()
  healthStatus.database = dbConnected ? "OK" : "DOWN"
  if (!dbConnected) overallStatus = 500

  // System check
  try {
    await pool.query("SELECT 1") // low-level direct query

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
  } catch (error: any) {
    healthStatus.status = "unhealthy"
    healthStatus.error = error?.message || "Unknown error"
    healthStatus.timestamp = new Date().toISOString()
    overallStatus = 503
  }

  return NextResponse.json(
    { status: overallStatus === 200 ? "OK" : "DEGRADED", ...healthStatus },
    { status: overallStatus }
  )
}
