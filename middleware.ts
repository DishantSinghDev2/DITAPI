import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/app/session"

export async function middleware(request: NextRequest) {
  const session = await getSession()
  const { pathname } = request.nextUrl

  const publicRoutes = [
    "/", "/apis", "/auth/signin", "/auth/signup",
    "/api/auth/signin", "/api/auth/signup", "/api/auth/signout",
    "/api/apis", "/api/categories", "/api/platform/stats", "/api/health", "/api/metrics",
    "/terms", "/privacy", "/cookies", "/about", "/blog", "/contact",
    "/status", "/docs", "/pricing", "/support", "/og-image.jpg",
  ]

  // Match dynamic routes (e.g., /apis/[slug])
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.includes("[slug]")) {
      const regex = new RegExp(`^${route.replace("[slug]", "[^/]+")}$`)
      return regex.test(pathname)
    }
    return pathname === route
  }) || pathname.startsWith("/logos/")

  // Always allow gateway and static/image resources
  if (
    pathname.startsWith("/api/gateway") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users trying to access protected routes
  if (!session && !isPublicRoute) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect authenticated users from auth pages to dashboard
  if (session && (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const userRole = session?.role

  // Role-specific route access
  const roleAccess: Record<string, string[]> = {
    admin: ["/admin", "/dashboard", "/providers/studio"],
    provider: ["/dashboard", "/providers/studio"],
    developer: ["/dashboard"],
  }

  // Check access for authenticated users
  if (userRole && !isPublicRoute) {
    const allowedPrefixes = roleAccess[userRole] ?? []

    const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix))

    if (!isAllowed) {
      return NextResponse.redirect(new URL("/dashboard?message=unauthorized", request.url))
    }
  }

  return NextResponse.next()
}

// Apply to all non-static, non-image, and non-API routes

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
