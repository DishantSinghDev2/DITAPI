import { DeveloperDashboard } from "@/components/dashboard/developer-dashboard"
import { getSession } from "@/app/session"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getSession()

  console.log("User session:", session)

  if (!session) {
    redirect("/auth/signin?message=unauthenticated")
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Developer Dashboard</h1>
      <DeveloperDashboard user={session} />
    </div>
  )
}
