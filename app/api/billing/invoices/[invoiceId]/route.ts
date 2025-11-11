import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const session = await requireAuth()
    const { invoiceId } = await params
    const db = await getDatabase()

    const user = await db.collection("users").findOne({
      email: session.user?.email,
    })

    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(invoiceId),
      userId: user._id,
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
