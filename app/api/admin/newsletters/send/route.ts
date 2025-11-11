import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/nodemailer"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const db = await getDatabase()
    const { title, content, frequency } = await req.json()

    // Find subscribers
    const subscribers = await db
      .collection("newsletters")
      .find({
        frequency,
        unsubscribedAt: null,
      })
      .toArray()

    // Send emails
    let sent = 0
    for (const subscriber of subscribers) {
      const user = await db.collection("users").findOne({ _id: subscriber.userId })
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `DITAPI Newsletter: ${title}`,
          html: `
            <h2>${title}</h2>
            ${content}
            <hr>
            <p><a href="https://api.dishis.tech/settings/newsletters">Manage subscriptions</a></p>
          `,
        })
        sent++
      }
    }

    return NextResponse.json({ sent, total: subscribers.length })
  } catch (error) {
    console.error("[v0] Newsletter send error:", error)
    return NextResponse.json({ error: "Failed to send newsletters" }, { status: 500 })
  }
}
