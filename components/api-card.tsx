"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Zap } from "lucide-react"
import type { API } from "@/types/database"

interface ApiCardProps {
  api: API
}

export function ApiCard({ api }: ApiCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl font-bold truncate">
            <Link href={`/apis/${api.slug}`} className="hover:underline">
              {api.name}
            </Link>
          </CardTitle>
          {api.is_featured && <Badge variant="secondary">Featured</Badge>}
        </div>
        <CardDescription className="text-sm text-gray-600 line-clamp-2">{api.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {api.categories.slice(0, 2).map((category) => (
              <Badge key={category.id} variant="outline" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {api.categories.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{api.categories.length - 2}
              </Badge>
            )}
          </div>

          {/* Monthly Volume */}
          <div className="text-xs text-gray-500">
            <span className="font-medium">{formatNumber(api.monthly_call_volume)}</span> calls this month
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Star className="h-4 w-4 text-yellow-500 mr-1" />
          <span>{api.rating?.toFixed(1) || "N/A"}</span>
          <span className="mx-2">•</span>
          <span>{api.provider_id}</span> {/* TODO: Replace with provider name */}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Users className="h-4 w-4 mr-1" />
          <span>{api.total_subscribers?.toLocaleString() || 0} Subscribers</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <div className="flex items-center text-sm text-gray-500">
          <Zap className="h-4 w-4 mr-1" />
          <span>{api.average_latency || "N/A"}ms Avg. Latency</span>
        </div>
        <Badge variant={api.status === "active" ? "default" : "outline"}>{api.status}</Badge>
      </CardFooter>
    </Card>
  )
}
