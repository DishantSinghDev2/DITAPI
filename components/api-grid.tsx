"use client"

import { useEffect, useState } from "react"
import { ApiCard } from "./api-card"
import { Pagination } from "./pagination"
import { useSearchParams } from "next/navigation"

interface Api {
  id: string
  name: string
  slug: string
  description: string
  rating: number
  totalSubscribers: number
  averageLatency: number
  uptimePercentage: number
  provider: {
    id: string
    name: string
    logoUrl: string | null
    isVerified: boolean
  }
  categories: Array<{ id: string; name: string }>
  hasFreePlan: boolean
  monthlyCallVolume: number
}

export function ApiGrid() {
  const [apis, setApis] = useState<Api[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchApis()
  }, [searchParams])

  const fetchApis = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", currentPage.toString())
      params.set("limit", "12")

      const response = await fetch(`/api/apis?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setApis(data.apis)
        setTotalPages(Math.ceil(data.total / 12))
      }
    } catch (error) {
      console.error("Failed to fetch APIs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (!apis || apis.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>No APIs found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {apis.map((api) => (
          <ApiCard key={api.id} api={api} />
        ))}
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
    </div>
  )
}
