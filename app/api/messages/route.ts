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
    const conversationId = req.nextUrl.searchParams.get("conversationId")
    const skip = Number.parseInt(req.nextUrl.searchParams.get("skip") || "0")
    const limit = 50

    if (conversationId) {
      const messages = await db
        .collection("messages")
        .find({ conversationId: new ObjectId(conversationId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

      return NextResponse.json({ data: messages.reverse() })
    }

    // Get conversations
    const conversations = await db
      .collection("conversations")
      .find({
        $or: [{ senderId: new ObjectId(session.user.id) }, { recipientId: new ObjectId(session.user.id) }],
      })
      .sort({ lastMessageAt: -1 })
      .toArray()

    return NextResponse.json({ data: conversations })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const { conversationId, recipientId, content } = await req.json()

    const conversation = conversationId ? new ObjectId(conversationId) : new ObjectId()

    // Create or update conversation
    await db.collection("conversations").updateOne(
      {
        _id: conversation,
        $or: [
          { senderId: new ObjectId(session.user.id), recipientId: new ObjectId(recipientId) },
          { senderId: new ObjectId(recipientId), recipientId: new ObjectId(session.user.id) },
        ],
      },
      {
        $set: {
          lastMessageAt: new Date(),
          lastMessage: content,
        },
      },
      { upsert: true },
    )

    // Insert message
    const message = await db.collection("messages").insertOne({
      conversationId: conversation,
      senderId: new ObjectId(session.user.id),
      recipientId: new ObjectId(recipientId),
      content,
      read: false,
      createdAt: new Date(),
    })

    // Send notification email
    const recipient = await db.collection("users").findOne({ _id: new ObjectId(recipientId) })
    const sender = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) })

    if (recipient?.email) {
      await sendEmail({
        to: recipient.email,
        subject: `New message from ${sender?.name || sender?.email}`,
        html: `
          <p>You have a new message on DITAPI.</p>
          <blockquote>${content}</blockquote>
          <p><a href="https://api.dishis.tech/messages">View messages</a></p>
        `,
      })
    }

    return NextResponse.json({ _id: message.insertedId })
  } catch (error) {
    console.error("[v0] Message error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
