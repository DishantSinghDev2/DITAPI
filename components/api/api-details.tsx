"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Zap, FileText, LifeBuoy, Shield, Lock } from "lucide-react"
import type { API, PricingPlan, Review, Subscription, UserSession } from "@/types/api"
import { ApiTester } from "./api-tester"
import { ApiPricing } from "./api-pricing"
import { ApiReviews } from "./api-reviews"
import { ApiService } from "@/lib/api-service"
import { useEffect, useState } from "react"

interface ApiDetailsProps {
  api: API
  pricingPlans: PricingPlan[]
  reviews: Review[]
  userSubscription?: Subscription
  currentUser?: UserSession
}

export function ApiDetails({ api, pricingPlans, reviews, userSubscription, currentUser }: ApiDetailsProps) {
  const [apiLatency, setApiLatency] = useState<number | null>(api.average_latency)
  const [apiErrorRate, setApiErrorRate] = useState<number>(0)

  useEffect(() => {
    const fetchMetrics = async () => {
      const latencyMetrics = await ApiService.getApiLatencyMetrics(api.id)
      setApiLatency(latencyMetrics.avgLatency)

      const errorRate = await ApiService.getApiErrorRate(api.id)
      setApiErrorRate(errorRate)
    }
    fetchMetrics()
  }, [api.id])

  return (
    <div className="space-y-8">
      {/* API Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{api.name}</h1>
          <p className="text-lg text-gray-600 mb-4">{api.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span>{api.rating?.toFixed(1) || "N/A"}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{api.total_subscribers?.toLocaleString() || 0} Subscribers</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              <span>{apiLatency ? `${apiLatency.toFixed(0)}ms` : "N/A"} Avg. Latency</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              <span>{api.uptime_percentage?.toFixed(2) || "N/A"}% Uptime</span>
            </div>
            <div className="flex items-center">
              <Lock className="h-4 w-4 mr-1" />
              <span>{apiErrorRate.toFixed(2)}% Error Rate</span>
            </div>
          </div>
        </div>
        <Badge variant={api.status === "active" ? "default" : "outline"} className="text-lg px-4 py-2">
          {api.status}
        </Badge>
      </div>

      {/* API Details Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="test">Test Endpoint</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Overview</CardTitle>
              <CardDescription>Detailed information about the {api.name} API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-2">Description</h3>
                <p>{api.long_description || api.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Provider</h3>
                  <p className="text-gray-700">{api.provider_id}</p> {/* TODO: Fetch provider name */}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Base URL</h3>
                  <p className="text-gray-700 font-mono bg-gray-100 p-2 rounded-md break-all">{api.base_url}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-2">Useful Links</h3>
                <ul className="space-y-2">
                  {api.documentation_url && (
                    <li>
                      <a
                        href={api.documentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-2" /> API Documentation
                      </a>
                    </li>
                  )}
                  {api.support_url && (
                    <li>
                      <a
                        href={api.support_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <LifeBuoy className="h-4 w-4 mr-2" /> Support Page
                      </a>
                    </li>
                  )}
                  {api.terms_url && (
                    <li>
                      <a
                        href={api.terms_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-2" /> Terms of Service
                      </a>
                    </li>
                  )}
                  {api.privacy_url && (
                    <li>
                      <a
                        href={api.privacy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <Shield className="h-4 w-4 mr-2" /> Privacy Policy
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <ApiPricing api={api} pricingPlans={pricingPlans} userSubscription={userSubscription} />
        </TabsContent>

        <TabsContent value="test" className="mt-6">
          <ApiTester api={api} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <ApiReviews api={api} reviews={reviews} currentUser={currentUser} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
