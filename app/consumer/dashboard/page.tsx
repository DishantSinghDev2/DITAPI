"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"

interface ConsumerDashboard {
  spending: { today: number; month: number; total: number }
  usage: { requests: number; p95Latency: number; errorRate: number }
  subscriptions: { active: number; expiringSoon: number }
  usageChart: Array<{ date: string; requests: number; errors: number }>
  latencyChart: Array<{ date: string; p95: number; p99: number }>
  topApis: Array<{ name: string; calls: number; latency: number }>
}

export default function ConsumerDashboard() {
  const [data, setData] = useState<ConsumerDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/consumer/dashboard")
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!data) {
    return <div className="flex justify-center items-center min-h-screen">No data available</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Consumer Dashboard</h1>
        <p className="text-muted-foreground">Monitor your API usage and spending</p>
      </div>

      {/* Spending Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(data.spending.today / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(data.spending.month / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(data.spending.total / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.usage.requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">P95 Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.usage.p95Latency}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.usage.errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.subscriptions.active}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.subscriptions.expiringSoon} expiring soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Volume & Errors</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.usageChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="requests" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="errors" fill="#ef4444" stroke="#ef4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latency Percentiles</CardTitle>
            <CardDescription>P95 vs P99</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.latencyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
                <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top APIs */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used APIs</CardTitle>
          <CardDescription>By request count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topApis.map((api, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium">{api.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {api.calls.toLocaleString()} calls • {api.latency}ms avg
                  </p>
                </div>
                <Button variant="ghost">Manage</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
