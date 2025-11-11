"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CreditsPage() {
  const { data: creditData, mutate } = useSWR("/api/credits", fetcher)
  const [purchaseAmount, setPurchaseAmount] = useState("10")
  const [loading, setLoading] = useState(false)

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(purchaseAmount),
          paymentMethodId: "paypal",
        }),
      })
      if (res.ok) {
        mutate()
        setPurchaseAmount("10")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${creditData?.amount.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${creditData?.used.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${creditData?.available.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Purchase Credits</CardTitle>
          <CardDescription>Add credits to your account for overage requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="number"
              placeholder="Amount in USD"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              min="1"
              step="1"
            />
            <Button onClick={handlePurchase} disabled={loading}>
              {loading ? "Processing..." : "Purchase"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {creditData?.history && creditData.history.length > 0 ? (
            <div className="space-y-2">
              {creditData.history.map((tx: any) => (
                <div key={tx._id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={tx.type === "purchase" ? "text-green-600" : "text-red-600"}>
                      {tx.type === "purchase" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </p>
                    <Badge variant={tx.status === "completed" ? "default" : "secondary"}>{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
