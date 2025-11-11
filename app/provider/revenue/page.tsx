"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUpIcon } from "lucide-react"

export default function ProviderRevenue() {
  const { status } = useSession()
  const router = useRouter()
  const [apis, setApis] = useState<any[]>([])
  const [selectedApi, setSelectedApi] = useState("")
  const [revenue, setRevenue] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [days, setDays] = useState("30")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchAPIs()
    }
  }, [status, router])

  useEffect(() => {
    if (selectedApi) {
      fetchRevenue()
    }
  }, [selectedApi, days])

  const fetchAPIs = async () => {
    try {
      const response = await fetch("/api/provider/apis")
      if (response.ok) {
        const data = await response.json()
        setApis(data)
        if (data.length > 0) {
          setSelectedApi(data[0]._id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch APIs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRevenue = async () => {
    try {
      const response = await fetch(`/api/provider/revenue?api=${selectedApi}&days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setRevenue(data)
      }
    } catch (error) {
      console.error("Failed to fetch revenue:", error)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Revenue Analytics</h1>

        <div className="flex gap-4 mb-8">
          <Select value={selectedApi} onValueChange={setSelectedApi}>
            <SelectTrigger className="w-96">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {apis.map((api) => (
                <SelectItem key={api._id} value={api._id}>
                  {api.name}
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

        {revenue && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${revenue.totals.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-1">+12% from last period</p>
                  </div>
                  <TrendingUpIcon className="w-5 h-5 text-green-600" />
                </div>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <p className="text-2xl font-bold">{revenue.totals.activeSubscriptions}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Avg. Plan Price</p>
                <p className="text-2xl font-bold">${revenue.totals.avgPlanPrice.toFixed(2)}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{revenue.totals.churnRate.toFixed(1)}%</p>
              </Card>
            </div>

            {/* Revenue Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenue.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Plan Distribution & Subscriber by Plan */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue by Plan</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenue.planBreakdown}
                      dataKey="revenue"
                      nameKey="planName"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                    >
                      {revenue.planBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Subscribers by Plan</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenue.planBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="planName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="subscribers" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Plan Details Table */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Plan Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2">Plan</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Subscribers</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">MRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.plans.map((plan: any) => (
                      <tr key={plan._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 font-medium">{plan.name}</td>
                        <td className="text-right">${plan.price}</td>
                        <td className="text-right">{plan.subscribers}</td>
                        <td className="text-right font-semibold">${plan.totalRevenue.toFixed(2)}</td>
                        <td className="text-right text-green-600 font-semibold">${plan.mrr.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
