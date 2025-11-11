import { getDatabase } from "@/lib/db"
import { sendEmail } from "@/lib/nodemailer"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()

    // Get all active APIs
    const apis = await db.collection("apis").find({ status: "active" }).toArray()

    let checked = 0
    let failed = 0

    for (const api of apis) {
      try {
        // Check API health
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const startTime = Date.now()
        const response = await fetch(api.baseUrl, {
          method: "GET",
          signal: controller.signal,
        })
        const duration = Date.now() - startTime
        clearTimeout(timeoutId)

        if (!response.ok || duration > 3000) {
          // API is slow or down
          const org = await db.collection("organizations").findOne({ _id: api.organizationId })
          const owner = await db.collection("users").findOne({ _id: org?.ownerId })

          if (owner?.email) {
            await sendEmail({
              to: owner.email,
              subject: `DITAPI Alert: ${api.name} Health Issue`,
              html: `
                <h3>API Health Alert</h3>
                <p><strong>API:</strong> ${api.name}</p>
                <p><strong>Status:</strong> ${response.ok ? "Slow" : "Down"}</p>
                <p><strong>Response Time:</strong> ${duration}ms</p>
                <p>Please check your API and take corrective action.</p>
                <p><a href="https://api.dishis.tech/provider/analytics">View Analytics</a></p>
              `,
            })
            failed++
          }
        }

        checked++
      } catch (error) {
        console.error("[v0] Health check error for API:", error)
      }
    }

    return NextResponse.json({ checked, failed })
  } catch (error) {
    console.error("[v0] Health check cron error:", error)
    return NextResponse.json({ error: "Health check failed" }, { status: 500 })
  }
}
