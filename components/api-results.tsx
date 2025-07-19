"use client"

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

export function ApiResults() {
  // This file is intentionally left empty as its functionality has been consolidated into components/api-grid.tsx
  // The API grid component is now responsible for displaying API results.
}
