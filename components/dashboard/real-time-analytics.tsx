"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Zap, TrendingUp, AlertCircle } from "lucide-react"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { useToast } from "@/hooks/use-toast"
import type { ApiKey } from "@/types/api"

interface RealtimeAnalyticsProps {
  apiKey: ApiKey
}

interface UsageDataPoint {
  time: string
  totalRequests: number
  avgResponseTime: number
  errorCount: number
}

export function RealtimeAnalytics({ apiKey }: RealtimeAnalyticsProps) {
  const { toast } = useToast()
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [interval, setInterval] = useState<"hour" | "day" | "month">("hour")

  useEffect(() => {
    fetchUsageData()
    const intervalId = setInterval(fetchUsageData, 60000) // Refresh every minute
    return () => clearInterval(intervalId)
  }, [apiKey.id, interval])

  const fetchUsageData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/developer/usage?apiKeyId=${apiKey.id}&interval=${interval}`)
      const data = await response.json()
      if (data.success) {
        setUsageData(data.usageData)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load usage data.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching usage data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totalRequests = usageData.reduce((sum, data) => sum + data.totalRequests, 0)
  const avgResponseTime =
    usageData.length > 0 ? usageData.reduce((sum, data) => sum + data.avgResponseTime, 0) / usageData.length : 0
  const totalErrors = usageData.reduce((sum, data) => sum + data.errorCount, 0)
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Real-time API Usage</CardTitle>
        <Select value={interval} onValueChange={(value) => setInterval(value as "hour" | "day" | "month")}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Interval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">Last 24 Hours</SelectItem>
            <SelectItem value="day">Last 30 Days</SelectItem>
            <SelectItem value="month">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-gray-600">Loading real-time data...</p>
          </div>
        ) : usageData.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No usage data available for this period.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <h3 className="text-2xl font-bold">{totalRequests.toLocaleString()}</h3>
                  </div>
                  <Zap className="h-8 w-8 text-blue-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                    <h3 className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</h3>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <h3 className="text-2xl font-bold">{errorRate.toFixed(2)}%</h3>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </CardContent>
              </Card>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={usageData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(value) => {
                      if (interval === "hour")
                        return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      if (interval === "day")
                        return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" })
                      return new Date(value).toLocaleDateString([], { year: "numeric", month: "short" })
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      if (interval === "hour") return new Date(value).toLocaleString()
                      if (interval === "day") return new Date(value).toDateString()
                      return new Date(value).toLocaleString("default", { year: "numeric", month: "long" })
                    }}
                  />
                  <Area type="monotone" dataKey="totalRequests" stroke="#8884d8" fill="#8884d8" name="Requests" />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#82ca9d"
                    name="Avg. Response Time (ms)"
                    yAxisId="right"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
