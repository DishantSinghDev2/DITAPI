"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Category } from "@/types/database"

interface CategoryFilterProps {
  categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const router = useRouter()

  const handleCategorySelect = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug)
    if (categorySlug) {
      router.push(`/apis?category=${categorySlug}`)
    } else {
      router.push("/apis")
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => handleCategorySelect(null)}
        className="rounded-full"
      >
        All Categories
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.slug ? "default" : "outline"}
          onClick={() => handleCategorySelect(category.slug)}
          className="rounded-full"
        >
          {category.name}
          <Badge variant="secondary" className="ml-2">
            {category.api_count || 0}
          </Badge>
        </Button>
      ))}
    </div>
  )
}
