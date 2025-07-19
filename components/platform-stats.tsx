"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Zap, Globe } from "lucide-react"
import type { PlatformStats as PlatformStatsType } from "@/types/api"

export function StatsSection() {
  const [stats, setStats] = useState<PlatformStatsType | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/platform/stats")
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch platform stats:", error)
    }
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      icon: Globe,
      label: "APIs Available",
      value: stats.totalApis.toLocaleString(),
      color: "text-blue-600",
    },
    {
      icon: Users,
      label: "Developers",
      value: stats.totalDevelopers.toLocaleString(),
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      label: "API Calls (30d)",
      value: `${(stats.totalApiCalls / 1000000).toFixed(1)}M`,
      color: "text-purple-600",
    },
    {
      icon: Zap,
      label: "Avg. Uptime",
      value: `${stats.averageUptime}%`,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <div className="text-sm text-gray-600">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
