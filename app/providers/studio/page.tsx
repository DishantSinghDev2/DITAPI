import { ProviderDashboard } from "@/components/providers/provider-dashboard"
import { ApiService } from "@/lib/api-service"
import { getUserSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import type { Provider, API } from "@/types/database"

export default async function ProviderStudioPage() {
  const session = await getUserSession()

  if (!session || session.user.role !== "provider") {
    redirect("/auth/signin?callbackUrl=/providers/studio")
  }

  // In a real application, you'd fetch the provider associated with the logged-in user
  // For now, let's assume a direct mapping or fetch a default provider for demonstration
  const provider: Provider | undefined = await ApiService.getProviderBySlug("openai") // Example: Fetch OpenAI as a default provider

  if (!provider) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Provider Not Found</h1>
        <p className="text-gray-600">
          It looks like you are not associated with a provider account. Please contact support.
        </p>
      </div>
    )
  }

  const apis: API[] = await ApiService.getAllApis(100, 0, undefined, undefined) // Fetch all APIs for now, filter by provider_id in component
  const providerApis = apis.filter((api) => api.provider_id === provider.id)

  // Fetch usage data for provider's APIs
  const now = new Date()
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))
  const apiUsagePromises = providerApis.map((api) =>
    ApiService.getApiUsageByTime(api.id, "day", thirtyDaysAgo, new Date()),
  )
  const apiUsageResults = await Promise.all(apiUsagePromises)

  const apiUsage = providerApis.map((api, index) => ({
    apiId: api.id,
    apiName: api.name,
    usageData: apiUsageResults[index],
  }))

  return (
    <div className="container mx-auto py-12">
      <ProviderDashboard provider={provider} apis={providerApis} apiUsage={apiUsage} />
    </div>
  )
}
