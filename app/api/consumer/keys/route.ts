import { connectToDatabase } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const keys = await db
      .collection("api_keys")
      .find({ userId: session.user.id })
      .project({
        _id: 1,
        apiId: 1,
        planId: 1,
        status: 1,
        lastUsedAt: 1,
        createdAt: 1,
        keyHash: 1,
      })
      .toArray()

    return NextResponse.json({
      keys: keys.map((k: any) => ({
        ...k,
        _id: k._id?.toString(),
        keyPreview: k.keyHash?.substring(0, 8),
      })),
    })
  } catch (error) {
    console.error("Error fetching keys:", error)
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 })
  }
}
