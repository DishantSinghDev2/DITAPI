"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircleIcon, AlertCircleIcon } from "lucide-react"

export default function BillingReturn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    const token = searchParams.get("token")
    const subscriptionId = searchParams.get("subscription")

    if (token && subscriptionId) {
      executeAgreement(token, subscriptionId)
    }
  }, [searchParams])

  const executeAgreement = async (token: string, subscriptionId: string) => {
    try {
      const response = await fetch("/api/billing/execute-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, subscriptionId }),
      })

      if (response.ok) {
        setStatus("success")
      } else {
        setStatus("error")
      }
    } catch (error) {
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Card className="p-8 text-center">
          {status === "loading" && (
            <>
              <Spinner className="mx-auto mb-4" />
              <p className="text-lg font-semibold">Processing payment...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
              <p className="text-muted-foreground mb-6">Your subscription is now active</p>
              <Button onClick={() => router.push("/consumer/subscriptions")} className="w-full">
                View Subscriptions
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircleIcon className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
              <p className="text-muted-foreground mb-6">There was an issue processing your payment</p>
              <Button onClick={() => router.back()} className="w-full">
                Try Again
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
