"use client"

import { useState, useEffect } from "react"
import { SearchBar } from "./search-bar"
import { CategoryFilter } from "./category-filter"
import { ApiGrid } from "./api-grid"
import type { API, Category } from "@/types/database"

export function ApiMarketplace() {
  const [apis, setApis] = useState<API[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [apisResponse, categoriesResponse] = await Promise.all([fetch("/api/apis"), fetch("/api/categories")])

      const apisData = await apisResponse.json()
      const categoriesData = await categoriesResponse.json()

      if (apisData.success) {
        setApis(apisData.apis)
      }
      if (categoriesData.success) {
        setCategories(categoriesData.categories)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Discover Amazing APIs</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse thousands of APIs from verified providers. Find the perfect API for your next project.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse bg-gray-200 h-12 w-96 rounded-lg"></div>
          </div>
        </div>
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Discover Amazing APIs</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse thousands of APIs from verified providers. Find the perfect API for your next project.
          </p>
        </div>
        <div className="flex justify-center">
          <SearchBar placeholder="Search APIs, providers, or categories..." />
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Browse by Category</h2>
        <CategoryFilter categories={categories} />
      </div>

      {/* API Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Available APIs</h2>
          <div className="text-sm text-gray-500">Showing {apis.length} results</div>
        </div>
        <ApiGrid apis={apis} />
      </div>
    </div>
  )
}
