import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { getUserByEmail } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const user = await getUserByEmail(session.user?.email!)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
