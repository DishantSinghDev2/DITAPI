"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, TrendingUp } from "lucide-react"

interface FeaturedApi {
  id: string
  name: string
  description: string
  category: string
  provider_name: string
  rating: number
  total_requests: number
  pricing_model: string
  logo_url: string
  slug: string
}

/**
 * Displays the most popular APIs on the marketplace.
 * Fetches data from /api/apis/featured at mount time.
 */
export function FeaturedApis() {
  const [apis, setApis] = useState<FeaturedApi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/apis/featured")
        const json = await res.json()
        if (res.ok && Array.isArray(json)) {
          setApis(json)
        } else {
          console.error("Unexpected featured-API payload:", json)
        }
      } catch (err) {
        console.error("Failed to fetch featured APIs:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (apis.length === 0) {
    return <p className="text-center text-gray-500">No featured APIs at the moment.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {apis.map((api) => (
        <Link key={api.id} href={`/apis/${api.slug}`} className="group">
          <Card className="h-full transition-shadow group-hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={api.logo_url || "/placeholder.svg"}
                  alt={`${api.name} logo`}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <CardTitle className="text-lg">{api.name}</CardTitle>
                  <CardDescription className="text-xs">{api.provider_name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-2">{api.description}</p>

              <div className="flex items-center justify-between text-sm">
                <Badge variant="secondary">{api.category}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{api.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>{api.total_requests.toLocaleString()} requests</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={api.pricing_model === "free" ? "default" : "outline"}>{api.pricing_model}</Badge>
                <Button size="sm" variant="outline" asChild>
                  <span>View API</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
