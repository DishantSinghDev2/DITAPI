"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StatusData {
  status: string
  uptime: number
  components: Array<{ name: string; status: string }>
  incidents: any[]
  lastUpdated: string
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status/page")
        const data = await res.json()
        setStatus(data)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div>Loading...</div>

  const statusColors: Record<string, string> = {
    operational: "bg-green-100 text-green-800",
    degraded: "bg-yellow-100 text-yellow-800",
    partial_outage: "bg-orange-100 text-orange-800",
    major_outage: "bg-red-100 text-red-800",
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">DITAPI Status</h1>
        <p className="text-muted-foreground">System status and incident history</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall Status</p>
              <Badge className={statusColors[status?.status || "degraded"]}>
                {status?.status?.toUpperCase() || "UNKNOWN"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uptime (30 days)</p>
              <p className="text-2xl font-bold">{status?.uptime}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm">{new Date(status?.lastUpdated!).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Components</CardTitle>
          <CardDescription>Individual service status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status?.components?.map((component: any) => (
              <div key={component.name} className="flex justify-between items-center p-3 border rounded">
                <span>{component.name}</span>
                <Badge className={statusColors[component.status]}>{component.status.toUpperCase()}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {status?.incidents && status.incidents.length > 0 ? (
            <div className="space-y-4">
              {status.incidents.map((incident: any) => (
                <div key={incident._id} className="border-l-4 border-red-500 pl-4 py-2">
                  <h3 className="font-semibold">{incident.title}</h3>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(incident.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent incidents</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
