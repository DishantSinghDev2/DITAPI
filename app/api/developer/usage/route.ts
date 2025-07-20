import { NextResponse } from "next/server"
import { getSession } from "@/app/session"
import { getApiUsageForUser } from "@/lib/database/dashboard-queries"

export async function GET(request: Request) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const apiKeyId = searchParams.get("apiKeyId")
  const apiId = searchParams.get("apiId")
  const interval = (searchParams.get("interval") as "hour" | "day" | "month") || "day"

  if (!apiKeyId && !apiId) {
    return NextResponse.json({ error: "apiKeyId or apiId is required" }, { status: 400 })
  }

  try {
    const usageData = await getApiUsageForUser(session.user.id, { apiKeyId, apiId, interval })
    return NextResponse.json({ success: true, usageData }, { status: 200 })
  } catch (error) {
    console.error("Error fetching developer usage:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch usage data" }, { status: 500 })
  }
}
