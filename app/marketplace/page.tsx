"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SearchIcon } from "lucide-react"

export default function Marketplace() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [apis, setApis] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedAPI, setSelectedAPI] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchAPIs()
    }
  }, [status, router, search, page])

  const fetchAPIs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
      })

      const response = await fetch(`/api/marketplace/apis?${params}`)
      if (response.ok) {
        const data = await response.json()
        setApis(data.apis)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch APIs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!selectedAPI || !selectedPlan) return

    setIsSubscribing(true)
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId: selectedAPI._id,
          planId: selectedPlan._id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedAPI(null)
        setSelectedPlan(null)
        router.push("/consumer/subscriptions")
      }
    } catch (error) {
      console.error("Failed to subscribe:", error)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">API Marketplace</h1>

          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search APIs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading APIs...</div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {apis.map((api) => (
                <Card key={api._id} className="flex flex-col p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold mb-2">{api.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{api.description}</p>

                  <div className="mb-4 space-y-2">
                    <Badge variant="outline">{api.authentication}</Badge>
                    <div className="text-sm text-muted-foreground">
                      <p>Rate Limit: {api.rateLimit?.requestsPerMinute || "N/A"}/min</p>
                      <p>Daily: {api.rateLimit?.requestsPerDay || "N/A"} requests</p>
                    </div>
                  </div>

                  {api.plans && api.plans.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Starting from:</p>
                      <p className="text-lg font-bold">
                        ${Math.min(...api.plans.map((p: any) => p.price))}/
                        <span className="text-sm">{api.plans[0].billingCycle}</span>
                      </p>
                    </div>
                  )}

                  <Button onClick={() => setSelectedAPI(api)} className="w-full">
                    View Plans
                  </Button>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {total > apis.length && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="px-4 py-2">Page {page}</span>
                <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page * 12 >= total}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Plan Selection Dialog */}
        <Dialog open={!!selectedAPI} onOpenChange={(open) => !open && setSelectedAPI(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedAPI?.name}</DialogTitle>
              <DialogDescription>{selectedAPI?.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedAPI?.plans?.map((plan: any) => (
                <Card
                  key={plan._id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPlan?._id === plan._id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${plan.price}</p>
                      <p className="text-sm text-muted-foreground">/{plan.billingCycle}</p>
                    </div>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>Rate Limit: {plan.rateLimit}/min</li>
                    <li>Daily: {plan.requestsPerDay} requests</li>
                    {plan.trialDays > 0 && (
                      <li className="text-green-600 font-medium">{plan.trialDays} days free trial</li>
                    )}
                  </ul>
                </Card>
              ))}
            </div>

            <Button onClick={handleSubscribe} disabled={!selectedPlan || isSubscribing} className="w-full">
              {isSubscribing ? "Subscribing..." : "Subscribe Now"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
