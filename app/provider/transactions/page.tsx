"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DownloadIcon, SearchIcon, DollarSignIcon } from "lucide-react"

export default function ProviderTransactions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [type_filter, setTypeFilter] = useState("all")
  const [totals, setTotals] = useState({ revenue: 0, pending: 0, paid: 0 })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchTransactions()
    }
  }, [status, router, search, type_filter])

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (type_filter !== "all") params.append("type", type_filter)

      const response = await fetch(`/api/provider/transactions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
        setTotals(data.totals)
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/provider/transactions/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `provider-transactions-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
      }
    } catch (error) {
      console.error("Failed to export transactions:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Revenue & Transactions</h1>
          <Button onClick={handleExport} variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">${totals.revenue.toFixed(2)}</p>
              </div>
              <DollarSignIcon className="w-8 h-8 text-emerald-600" />
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Pending Payout</p>
            <p className="text-3xl font-bold text-orange-600">${totals.pending.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">Next payout in 5 days</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Total Paid Out</p>
            <p className="text-3xl font-bold">${totals.paid.toFixed(2)}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={type_filter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="payout">Payout</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <Card className="p-8 text-center">Loading transactions...</Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium capitalize">{tx.type}</TableCell>
                    <TableCell className="text-sm">{tx.description}</TableCell>
                    <TableCell className={`font-semibold ${tx.type === "payout" ? "text-emerald-600" : ""}`}>
                      {tx.type === "payout" ? "-" : "+"} ${Math.abs(tx.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tx.reference?.slice(0, 12)}...</TableCell>
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
