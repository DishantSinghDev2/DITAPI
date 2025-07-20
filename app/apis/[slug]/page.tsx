import { ApiDetails } from "@/components/api/api-details"
import { ApiService } from "@/lib/api-service"
import { notFound } from "next/navigation"
import { getUserSession } from "@/app/session"

interface ApiDetailPageProps {
  params: {
    slug: string
  }
}

export default async function ApiDetailPage({ params }: ApiDetailPageProps) {
  const api = await ApiService.getApiBySlug(params.slug)

  if (!api) {
    notFound()
  }

  const pricingPlans = await ApiService.getPricingPlansForApi(api.id)
  const reviews = await ApiService.getReviewsForApi(api.id)
  const session = await getUserSession()

  let userSubscription = undefined
  if (session?.user) {
    userSubscription = await ApiService.getActiveSubscriptionForUserAndApi(session.user.id, api.id)
  }

  return (
    <div className="container mx-auto py-12">
      <ApiDetails
        api={api}
        pricingPlans={pricingPlans}
        reviews={reviews}
        userSubscription={userSubscription}
        currentUser={session?.user}
      />
    </div>
  )
}
