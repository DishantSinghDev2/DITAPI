import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const db = await getDatabase()

    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const invoices = await db.collection("invoices").find({ userId: user._id }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
