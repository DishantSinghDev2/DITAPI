"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUpIcon, AlertCircleIcon } from "lucide-react"

export default function ConsumerAnalytics() {
  const { status } = useSession()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [selectedSub, setSelectedSub] = useState("")
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [days, setDays] = useState("30")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchSubscriptions()
    }
  }, [status, router])

  useEffect(() => {
    if (selectedSub) {
      fetchAnalytics()
    }
  }, [selectedSub, days])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
        if (data.length > 0) {
          setSelectedSub(data[0]._id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/consumer/analytics?subscription=${selectedSub}&days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Usage Analytics</h1>

        <div className="flex gap-4 mb-8">
          <Select value={selectedSub} onValueChange={setSelectedSub}>
            <SelectTrigger className="w-96">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subscriptions.map((sub) => (
                <SelectItem key={sub._id} value={sub._id}>
                  {sub.api?.name} - {sub.plan?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {analytics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{analytics.totals.totalRequests.toLocaleString()}</p>
                  </div>
                  <TrendingUpIcon className="w-5 h-5 text-primary" />
                </div>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.totals.successRate.toFixed(1)}%</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{Math.round(analytics.totals.avgResponseTime)}ms</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-2xl font-bold">{analytics.totals.errors}</p>
                  </div>
                  {analytics.totals.errors > 0 && <AlertCircleIcon className="w-5 h-5 text-destructive" />}
                </div>
              </Card>
            </div>

            {/* Request Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Request Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Endpoint Usage */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Endpoints</h3>
              <div className="space-y-3">
                {analytics.endpoints.map((endpoint: any) => (
                  <div key={endpoint.path} className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="font-mono text-sm">{endpoint.path}</span>
                    <span className="text-sm font-semibold">{endpoint.count} calls</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
