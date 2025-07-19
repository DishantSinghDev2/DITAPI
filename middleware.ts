import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function middleware(request: NextRequest) {
  const session = await getSession()
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/apis",
    "/apis/[slug]", // Dynamic API pages
    "/auth/signin",
    "/auth/signup",
    "/api/auth/signin",
    "/api/auth/signup",
    "/api/auth/signout",
    "/api/apis",
    "/api/categories",
    "/api/platform/stats",
    "/api/health",
    "/api/metrics",
    "/terms",
    "/privacy",
    "/cookies",
    "/about",
    "/blog",
    "/contact",
    "/status",
    "/docs",
    "/pricing",
    "/support",
    "/og-image.jpg", // For Open Graph images
    "/logos/:path*", // For company logos
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.includes("[slug]")) {
      const regex = new RegExp(`^${route.replace(/\[slug\]/g, "[^/]+")}$`)
      return regex.test(pathname)
    }
    if (route.endsWith("/*")) {
      const base = route.slice(0, -2)
      return pathname.startsWith(base)
    }
    return pathname === route
  })

  // Allow gateway requests to pass through without session check
  if (pathname.startsWith("/api/gateway")) {
    return NextResponse.next()
  }

  // If the user is not authenticated and trying to access a protected route
  if (!session?.user && !isPublicRoute) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If the user is authenticated and trying to access auth pages, redirect to dashboard
  if (session?.user && (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Specific role-based access control
  if (session?.user) {
    // Admin-only routes
    if (pathname.startsWith("/admin") && session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard?message=unauthorized_admin_access", request.url))
    }
    // Provider-only or Admin routes for Provider Studio
    if (pathname.startsWith("/providers/studio") && session.user.role !== "provider" && session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard?message=unauthorized_access", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
