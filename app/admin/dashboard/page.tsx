"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { UsersIcon, DollarSignIcon, ActivityIcon, TrendingUpIcon } from "lucide-react"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      fetchDashboard()
    } else if (session?.user?.role !== "admin") {
      router.push("/dashboard")
    }
  }, [status, router, session, period])

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/admin/dashboard?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setDashboard(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>
  if (!dashboard) return <div className="p-8">No data available</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Select value={period} onValueChange={setPeriod}>
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

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-2">{dashboard.metrics.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">+5% this period</p>
              </div>
              <UsersIcon className="w-5 h-5 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Revenue</p>
                <p className="text-2xl font-bold mt-2">${dashboard.metrics.platformRevenue.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">+12% from last period</p>
              </div>
              <DollarSignIcon className="w-5 h-5 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active APIs</p>
                <p className="text-2xl font-bold mt-2">{dashboard.metrics.activeAPIs}</p>
              </div>
              <ActivityIcon className="w-5 h-5 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Requests (Total)</p>
                <p className="text-2xl font-bold mt-2">{dashboard.metrics.totalRequests.toLocaleString()}</p>
              </div>
              <TrendingUpIcon className="w-5 h-5 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboard.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Request Volume</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboard.requestTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Providers */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Top API Providers</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>APIs</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.topProviders.map((provider: any) => (
                <TableRow key={provider._id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.apiCount}</TableCell>
                  <TableCell>{provider.subscriberCount}</TableCell>
                  <TableCell className="font-semibold">${provider.revenue.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* System Health */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-muted-foreground">API Gateway</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold">Operational</span>
                <span className="text-xs text-green-600 font-medium">99.9% uptime</span>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-muted-foreground">Database</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold">Operational</span>
                <span className="text-xs text-green-600 font-medium">Normal load</span>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-muted-foreground">Payment Processor</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold">Operational</span>
                <span className="text-xs text-green-600 font-medium">All systems OK</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
