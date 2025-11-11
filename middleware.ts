import { auth } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"

const protectedRoutes = ["/dashboard", "/provider", "/admin"]
const authRoutes = ["/auth/signin"]

export async function middleware(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname

  if (authRoutes.some((route) => pathname.startsWith(route)) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png|.*\\.jpg|.*\\.svg|api).*)"],
}
