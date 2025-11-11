import { getDatabase } from "@/lib/db"
import { auth } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const { frequency, categories } = await req.json()

    const result = await db.collection("newsletters").updateOne(
      { userId: new ObjectId(session.user.id) },
      {
        $set: {
          userId: new ObjectId(session.user.id),
          frequency,
          categories,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    await db.collection("newsletters").updateOne(
      { userId: new ObjectId(session.user.id) },
      {
        $set: {
          frequency: "none",
          unsubscribedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}
