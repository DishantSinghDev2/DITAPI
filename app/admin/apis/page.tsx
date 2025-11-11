"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchIcon } from "lucide-react"

export default function AdminAPIs() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [apis, setApis] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status_filter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user?.role !== "admin") {
      router.push("/dashboard")
    } else if (status === "authenticated") {
      fetchAPIs()
    }
  }, [status, router, session, search, status_filter])

  const fetchAPIs = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (status_filter !== "all") params.append("status", status_filter)

      const response = await fetch(`/api/admin/apis?${params}`)
      if (response.ok) {
        const data = await response.json()
        setApis(data)
      }
    } catch (error) {
      console.error("Failed to fetch APIs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Management</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search APIs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={status_filter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* APIs Table */}
        {isLoading ? (
          <Card className="p-8 text-center">Loading APIs...</Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>API Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Monthly Volume</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apis.map((api) => (
                  <TableRow key={api._id}>
                    <TableCell className="font-medium">{api.name}</TableCell>
                    <TableCell>{api.provider?.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          api.status === "published"
                            ? "default"
                            : api.status === "suspended"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {api.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{api.subscriberCount}</TableCell>
                    <TableCell>{api.monthlyRequests.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
