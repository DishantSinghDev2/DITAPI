"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProviderAnalytics() {
  const { status } = useSession()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [selectedSubscription, setSelectedSubscription] = useState("")
  const [metrics, setMetrics] = useState<any>(null)
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
    if (selectedSubscription) {
      fetchMetrics()
    }
  }, [selectedSubscription, days])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
        if (data.length > 0) {
          setSelectedSubscription(data[0]._id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/gateway/metrics?subscription=${selectedSubscription}&days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Analytics</h1>

        <div className="flex gap-4 mb-8">
          <Select value={selectedSubscription} onValueChange={setSelectedSubscription}>
            <SelectTrigger className="w-64">
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

        {metrics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{metrics.totals.totalRequests}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-destructive">{metrics.totals.totalErrors}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{Math.round(metrics.totals.avgResponseTime)}ms</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {metrics.totals.totalRequests > 0
                    ? (
                        ((metrics.totals.totalRequests - metrics.totals.totalErrors) / metrics.totals.totalRequests) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </Card>
            </div>

            {/* Request Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Request Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="requestCount" stroke="hsl(var(--primary))" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Status Codes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status Code Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(metrics.totals.statusCodes).map(([code, count]) => ({
                    status: code,
                    count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
