// This file defines health check logic for the gateway.
// In a production environment, this would be exposed via a dedicated endpoint
// (e.g., /health) for monitoring systems like Kubernetes or load balancers.

import { db } from "@/lib/database/connection"
import { sql } from "drizzle-orm"
import { kv } from "@vercel/kv"

export async function performHealthCheck(): Promise<{ status: string; details: { [key: string]: any } }> {
  const healthDetails: { [key: string]: any } = {}
  let overallStatus = "healthy"

  // 1. Database Connection Check
  try {
    await db.execute(sql`SELECT 1`)
    healthDetails.database = { status: "healthy", message: "Database connection successful" }
  } catch (error: any) {
    overallStatus = "unhealthy"
    healthDetails.database = { status: "unhealthy", message: `Database connection failed: ${error.message}` }
    console.error("Health Check: Database connection failed", error)
  }

  // 2. Vercel KV (Redis) Connection Check
  try {
    await kv.set("health_check_test", "ok", { ex: 5 }) // Set with a short expiry
    const value = await kv.get("health_check_test")
    if (value === "ok") {
      healthDetails.redis = { status: "healthy", message: "Vercel KV connection successful" }
    } else {
      overallStatus = "unhealthy"
      healthDetails.redis = { status: "unhealthy", message: "Vercel KV test failed" }
    }
  } catch (error: any) {
    overallStatus = "unhealthy"
    healthDetails.redis = { status: "unhealthy", message: `Vercel KV connection failed: ${error.message}` }
    console.error("Health Check: Vercel KV connection failed", error)
  }

  // 3. External API Reachability Check (Example: Check if a critical external API is reachable)
  // This is a placeholder. You would replace 'https://api.example.com/health' with an actual critical dependency.
  try {
    const externalApiUrl = "https://api.openai.com/v1/models" // Example: Check OpenAI API
    const response = await fetch(externalApiUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) }) // 5-second timeout
    if (response.ok) {
      healthDetails.externalApi = { status: "healthy", message: `External API (${externalApiUrl}) reachable` }
    } else {
      overallStatus = "degraded" // Degraded if external API is down but gateway can still function partially
      healthDetails.externalApi = {
        status: "degraded",
        message: `External API (${externalApiUrl}) returned status ${response.status}`,
      }
    }
  } catch (error: any) {
    overallStatus = "degraded"
    healthDetails.externalApi = { status: "degraded", message: `External API check failed: ${error.message}` }
    console.error("Health Check: External API check failed", error)
  }

  // 4. Gateway Configuration Check (basic)
  try {
    const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "NEXT_PUBLIC_DITAPI_SUBDOMAIN_BASE"]
    const missingVars = requiredEnvVars.filter((env) => !process.env[env])
    if (missingVars.length > 0) {
      overallStatus = "unhealthy"
      healthDetails.configuration = {
        status: "unhealthy",
        message: `Missing environment variables: ${missingVars.join(", ")}`,
      }
    } else {
      healthDetails.configuration = { status: "healthy", message: "All required environment variables are set" }
    }
  } catch (error: any) {
    overallStatus = "unhealthy"
    healthDetails.configuration = { status: "unhealthy", message: `Configuration check failed: ${error.message}` }
    console.error("Health Check: Configuration check failed", error)
  }

  return { status: overallStatus, details: healthDetails }
}
