"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get("subscription")
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (subscriptionId) {
      fetchSubscription()
    }
  }, [status, subscriptionId, router])

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`)
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to PayPal approval URL
        window.location.href = data.approvalUrl
      }
    } catch (error) {
      console.error("Payment error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <p className="text-muted-foreground">Subscription not found</p>
          <Button onClick={() => router.push("/consumer/subscriptions")} className="mt-4">
            Back to Subscriptions
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>

          <div className="space-y-4 mb-8">
            <div>
              <p className="text-sm text-muted-foreground">API</p>
              <p className="font-semibold">{subscription.api?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-semibold">{subscription.plan?.name}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">${subscription.plan?.price}</p>
            </div>
          </div>

          <Button onClick={handlePayment} disabled={isLoading} className="w-full mb-4">
            {isLoading ? "Processing..." : "Pay with PayPal"}
          </Button>

          <Button variant="outline" onClick={() => router.back()} disabled={isLoading} className="w-full">
            Cancel
          </Button>
        </Card>
      </div>
    </div>
  )
}
