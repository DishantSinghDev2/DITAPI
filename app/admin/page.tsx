import { redirect } from "next/navigation"
import { getSession } from "@/app/session"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { ApiService } from "@/lib/api-service"
import type { User } from "@/types/database"

export default async function AdminPage() {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    redirect("/auth/signin")
  }

  // Get admin user details
  const adminUser = (await ApiService.getUserById(session.id)) as User
  if (!adminUser) {
    redirect("/auth/signin")
  }

  // Get platform statistics
  const platformStats = await ApiService.getPlatformOverviewStats()
  const topApisByUsage = await ApiService.getTopApisByUsage(5)
  const recentSignups = await ApiService.getAllUsers(10, 0) // Get recent 10 users

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminDashboard
        adminUser={adminUser}
        platformStats={platformStats}
        topApisByUsage={topApisByUsage}
        recentSignups={recentSignups}
      />
    </div>
  )
}
