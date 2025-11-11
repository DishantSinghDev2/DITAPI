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
import { DownloadIcon, SearchIcon } from "lucide-react"

export default function ConsumerTransactions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status_filter, setStatusFilter] = useState("all")
  const [totals, setTotals] = useState({ spent: 0, subscriptions: 0 })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchTransactions()
    }
  }, [status, router, search, status_filter])

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (status_filter !== "all") params.append("status", status_filter)

      const response = await fetch(`/api/billing/transactions?${params}`)
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
      const response = await fetch("/api/billing/transactions/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
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
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <Button onClick={handleExport} variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Total Spent (30 days)</p>
            <p className="text-3xl font-bold">${totals.spent.toFixed(2)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            <p className="text-3xl font-bold">{totals.subscriptions}</p>
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
          <Select value={status_filter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
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
                  <TableHead>API</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{tx.api?.name}</TableCell>
                    <TableCell>{tx.plan?.name}</TableCell>
                    <TableCell className="font-semibold">${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === "completed" ? "default" : tx.status === "failed" ? "destructive" : "secondary"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {tx.paypalTransactionId?.slice(0, 12)}...
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
