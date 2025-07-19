"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import CategoryFilter from "@/components/category-filter"

interface Category {
  id: string
  name: string
  slug: string
}

export function ApiFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all")
  const [hasFreePlan, setHasFreePlan] = useState(searchParams.get("hasFreePlan") === "true")
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "popularity")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (selectedCategory) {
      params.set("category", selectedCategory)
    } else {
      params.delete("category")
    }

    if (hasFreePlan) {
      params.set("hasFreePlan", "true")
    } else {
      params.delete("hasFreePlan")
    }

    if (sortBy) {
      params.set("sortBy", sortBy)
    } else {
      params.delete("sortBy")
    }

    // Reset page to 1 when filters change
    params.set("page", "1")

    router.push(`/apis?${params.toString()}`)
  }

  const resetFilters = () => {
    setSelectedCategory("")
    setHasFreePlan(false)
    setSortBy("popularity")
    router.push("/apis")
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        loadingCategories={loadingCategories}
      />

      <div className="flex-1 w-full md:w-auto">
        <Label htmlFor="sort-by" className="sr-only">
          Sort By
        </Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger id="sort-by" className="w-full">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 w-full md:w-auto">
        <Checkbox id="free-plan" checked={hasFreePlan} onCheckedChange={(checked) => setHasFreePlan(!!checked)} />
        <Label htmlFor="free-plan">Free Plan Available</Label>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        <Button onClick={applyFilters} className="w-full md:w-auto">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto bg-transparent">
          Reset
        </Button>
      </div>
    </div>
  )
}
