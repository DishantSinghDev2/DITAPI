"use client"

import { useState, useEffect } from "react"

interface StatsData {
  totalApis: number
  totalProviders: number
  totalRequests: number
  totalDevelopers: number
}

export function StatsSection() {
  const [stats, setStats] = useState<StatsData>({
    totalApis: 0,
    totalProviders: 0,
    totalRequests: 0,
    totalDevelopers: 0,
  })
  const [loading, setLoading] = useState(true)

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
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="animate-pulse bg-gray-200 h-12 w-24 mx-auto mb-2 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-16 mx-auto rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">{formatNumber(stats.totalApis)}</div>
        <div className="text-gray-600">APIs Available</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600 mb-2">{formatNumber(stats.totalProviders)}</div>
        <div className="text-gray-600">API Providers</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-purple-600 mb-2">{formatNumber(stats.totalRequests)}</div>
        <div className="text-gray-600">API Requests</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-orange-600 mb-2">{formatNumber(stats.totalDevelopers)}</div>
        <div className="text-gray-600">Developers</div>
      </div>
    </div>
  )
}
