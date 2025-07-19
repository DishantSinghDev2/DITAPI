import { getAdminSession } from "./admin-session"
import { redirect } from "next/navigation"

export async function requireAdminAuth() {
  const session = await getAdminSession()

  if (!session || session.user.role !== "admin") {
    redirect("/auth/signin?message=unauthorized_admin_access")
  }

  return session.user
}

export async function requireProviderOrAdminAuth() {
  const session = await getAdminSession() // getAdminSession also checks for provider role

  if (!session || (session.user.role !== "admin" && session.user.role !== "provider")) {
    redirect("/auth/signin?message=unauthorized_access")
  }

  return session.user
}
