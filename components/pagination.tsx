"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const pageParam = searchParams.get("page")
    const page = pageParam ? Number.parseInt(pageParam) : 1
    if (page !== currentPage) {
      onPageChange(page)
    }
  }, [searchParams, currentPage, onPageChange])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const renderPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5 // Number of page buttons to display

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    if (startPage > 1) {
      pages.push(
        <Button key={1} variant="outline" onClick={() => handlePageChange(1)}>
          1
        </Button>,
      )
      if (startPage > 2) {
        pages.push(
          <span key="dots-start" className="px-2 text-muted-foreground">
            ...
          </span>,
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button key={i} variant={i === currentPage ? "default" : "outline"} onClick={() => handlePageChange(i)}>
          {i}
        </Button>,
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots-end" className="px-2 text-muted-foreground">
            ...
          </span>,
        )
      }
      pages.push(
        <Button key={totalPages} variant="outline" onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Button>,
      )
    }

    return pages
  }

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {renderPageNumbers()}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
