"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CopyIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"

export default function ConsumerSubscriptions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedApiKey, setCopiedApiKey] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchSubscriptions()
    }
  }, [status, router])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyAPIKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    setCopiedApiKey(apiKey)
    setTimeout(() => setCopiedApiKey(""), 2000)
  }

  const handleCancel = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchSubscriptions()
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Subscriptions</h1>
          <Link href="/marketplace">
            <Button>Browse APIs</Button>
          </Link>
        </div>

        {subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{subscription.api?.name}</h3>
                    <p className="text-sm text-muted-foreground">{subscription.plan?.name}</p>
                  </div>
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                    {subscription.status}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">API Key</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted p-2 rounded flex-1 truncate">
                        {subscription.apiKey?.slice(0, 8)}...
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => handleCopyAPIKey(subscription.apiKey)}>
                        <CopyIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Rate Limit</p>
                    <p className="text-sm font-medium mt-1">{subscription.plan?.rateLimit}/min</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Renewal Date</p>
                    <p className="text-sm font-medium mt-1">
                      {new Date(subscription.renewalDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/consumer/subscriptions/${subscription._id}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      View Details
                    </Button>
                  </Link>

                  {subscription.status !== "cancelled" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this subscription? You will lose access to the API at the
                            end of the billing cycle.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogAction onClick={() => handleCancel(subscription._id)}>
                          Cancel Subscription
                        </AlertDialogAction>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-6">No active subscriptions</p>
            <Link href="/marketplace">
              <Button>Browse APIs</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
