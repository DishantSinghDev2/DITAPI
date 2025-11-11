import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDatabase()
    await db.collection("_ping").findOne({})

    return NextResponse.json({ status: "ok", timestamp: new Date() })
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
