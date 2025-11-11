import { auth } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "provider")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()

    const apis = await db.collection("apis").find({ organizationId: session.user.id }).toArray()

    return NextResponse.json(apis)
  } catch (error) {
    console.error("Error fetching provider APIs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
