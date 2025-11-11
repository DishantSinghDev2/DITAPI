"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminSupportPage() {
  const { data: tickets } = useSWR("/api/support/tickets", fetcher)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-blue-100 text-blue-800",
  }

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    "in-progress": "bg-purple-100 text-purple-800",
    "waiting-customer": "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Support Tickets Management</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tickets?.filter((t: any) => t.status === "open").length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tickets?.filter((t: any) => t.status === "in-progress").length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {tickets?.filter((t: any) => t.priority === "urgent").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-2">
              {tickets
                ?.filter((t: any) => t.status === "open")
                .map((ticket: any) => (
                  <div
                    key={ticket._id}
                    className="p-4 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">{ticket.category}</p>
                      </div>
                      <div className="space-x-2">
                        <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                        <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
