import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/nodemailer"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const { message } = await req.json()
    const ticketId = new ObjectId(params.ticketId)

    // Verify ticket ownership or admin
    const ticket = await db.collection("support_tickets").findOne({ _id: ticketId })
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 })

    const isAdmin = (session.user as any).role === "admin"
    if (!isAdmin && ticket.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db.collection("support_tickets").updateOne(
      { _id: ticketId },
      {
        $push: {
          messages: {
            userId: new ObjectId(session.user.id),
            message,
            isAdmin,
            createdAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      },
    )

    // Send notification email to the other party
    const targetUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(isAdmin ? ticket.userId : process.env.ADMIN_EMAIL) })

    if (targetUser?.email) {
      await sendEmail({
        to: targetUser.email,
        subject: `New message on ticket: ${ticket.subject}`,
        html: `
          <h3>${isAdmin ? "Admin" : "Customer"} replied</h3>
          <p>${message}</p>
          <p><a href="https://api.dishis.tech/support/tickets/${ticketId}">View ticket</a></p>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Message error:", error)
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
  }
}
