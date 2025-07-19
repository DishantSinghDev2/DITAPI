import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { ApiService } from "@/lib/api-service"
import { getUserSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import type { User, API } from "@/types/database"

export default async function AdminPage() {
  const session = await getUserSession()

  if (!session || session.user.role !== "admin") {
    redirect("/auth/signin?callbackUrl=/admin")
  }

  const platformStats = await ApiService.getPlatformOverviewStats()
  const topApisByUsage: API[] = await ApiService.getTopApisByUsage(5)
  // For recent signups, you'd typically have a query to get users ordered by creation date
  // For now, let's mock some recent users or fetch all and sort (not efficient for large datasets)
  const allUsers = await ApiService.getAllUsers() // Assuming a new getAllUsers method in ApiService
  const recentSignups: User[] = allUsers
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5)

  return (
    <div className="container mx-auto py-12">
      <AdminDashboard platformStats={platformStats} topApisByUsage={topApisByUsage} recentSignups={recentSignups} />
    </div>
  )
}
