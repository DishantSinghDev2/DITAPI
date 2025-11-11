"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Invoice {
  _id: string
  periodStart: string
  periodEnd: string
  totalCents: number
  currency: string
  status: string
  pdfUrl?: string
  lines?: Array<{ apiId: string; qty: number; amountCents: number }>
}

export default function ConsumerInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSpent: 0,
    unpaid: 0,
    upcomingPayment: 0,
  })

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    const filtered = invoices.filter((i) => i.periodStart.toLowerCase().includes(search.toLowerCase()))
    setFilteredInvoices(filtered)
  }, [search, invoices])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/consumer/invoices")
      const data = await response.json()
      setInvoices(data.invoices || [])

      // Calculate stats
      const totalSpent = data.invoices
        .filter((i: Invoice) => i.status === "paid")
        .reduce((sum: number, i: Invoice) => sum + i.totalCents, 0)

      const unpaid = data.invoices
        .filter((i: Invoice) => i.status === "open")
        .reduce((sum: number, i: Invoice) => sum + i.totalCents, 0)

      setStats({
        totalSpent,
        unpaid,
        upcomingPayment: unpaid > 0 ? unpaid : 0,
      })
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Invoices & Billing</h1>
        <p className="text-muted-foreground">Manage your invoices and billing history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.totalSpent / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${(stats.unpaid / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.upcomingPayment / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Due next month</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>Download and view your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Period</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell>
                      {new Date(invoice.periodStart).toLocaleDateString()} -{" "}
                      {new Date(invoice.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">${(invoice.totalCents / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "paid" ? "default" : invoice.status === "open" ? "secondary" : "outline"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {invoice.pdfUrl && (
                          <Button variant="outline" size="sm">
                            Download PDF
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No invoices found</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
