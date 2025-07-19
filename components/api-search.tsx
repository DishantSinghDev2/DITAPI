"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"

// This file is intentionally left empty as its functionality has been consolidated into components/search-bar.tsx
// The search bar component is now used directly in the API marketplace.

export function ApiSearch() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSearchQuery = searchParams.get("search") || ""
  const [query, setQuery] = useState(initialSearchQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) {
      params.set("search", query.trim())
    } else {
      params.delete("search")
    }
    router.push(`/apis?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="relative flex w-full max-w-xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search APIs, providers, or categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-l-lg"
        />
      </div>
      <Button type="submit" className="px-8 py-3 text-lg rounded-r-lg rounded-l-none">
        Search
      </Button>
    </form>
  )
}
