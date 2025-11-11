import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/nodemailer"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const skip = Number.parseInt(req.nextUrl.searchParams.get("skip") || "0")
    const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") || "20")

    const tickets = await db
      .collection("support_tickets")
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection("support_tickets").countDocuments({
      userId: new ObjectId(session.user.id),
    })

    return NextResponse.json({ data: tickets, total })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const { subject, description, category, priority } = await req.json()

    const ticket = await db.collection("support_tickets").insertOne({
      userId: new ObjectId(session.user.id),
      subject,
      description,
      category,
      priority,
      status: "open",
      messages: [
        {
          userId: new ObjectId(session.user.id),
          message: description,
          isAdmin: false,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send confirmation email
    await sendEmail({
      to: session.user.email!,
      subject: `Support Ticket Created: ${subject}`,
      html: `
        <h2>Your support ticket has been created</h2>
        <p><strong>Ticket ID:</strong> ${ticket.insertedId}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p>Our support team will review your ticket shortly.</p>
      `,
    })

    return NextResponse.json({ _id: ticket.insertedId })
  } catch (error) {
    console.error("[v0] Ticket creation error:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}
