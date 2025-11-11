import { connectToDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const invoices = await db.collection("invoices").find({}).sort({ createdAt: -1 }).limit(50).toArray()

    return NextResponse.json({
      invoices: invoices.map((i: any) => ({
        _id: i._id?.toString(),
        periodStart: i.periodStart?.toISOString(),
        periodEnd: i.periodEnd?.toISOString(),
        totalCents: i.totalCents,
        currency: i.currency,
        status: i.status,
        pdfUrl: i.pdfUrl,
        lines: i.lines,
      })),
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
