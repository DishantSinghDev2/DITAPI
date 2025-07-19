import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth/admin-session"
import { getPlatformAnalyticsFromDb } from "@/lib/database/admin-queries"

export async function GET() {
  const session = await getAdminSession()

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const analytics = await getPlatformAnalyticsFromDb()
    return NextResponse.json({ success: true, analytics }, { status: 200 })
  } catch (error) {
    console.error("Error fetching admin analytics:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch analytics" }, { status: 500 })
  }
}
