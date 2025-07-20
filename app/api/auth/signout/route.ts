import { NextResponse } from "next/server"
import { deleteSession } from "@/app/session"

export async function POST() {
  try {
    await deleteSession()


    return NextResponse.json({
      success: true,
      message: "Successfully signed out"
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
