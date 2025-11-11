"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function BillingCancel() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground mb-6">You have cancelled the payment process</p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/consumer/subscriptions")} className="w-full">
              Back to Subscriptions
            </Button>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
