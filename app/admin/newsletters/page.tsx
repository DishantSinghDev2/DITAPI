"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminNewslettersPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    frequency: "weekly",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/newsletters/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Newsletter Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Send Newsletter</CardTitle>
          <CardDescription>Send announcements and updates to subscribers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <Alert>
              <AlertDescription>
                Newsletter sent to {result.sent} subscribers ({result.total} total)
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Newsletter title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Frequency</label>
            <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Subscribers</SelectItem>
                <SelectItem value="weekly">Weekly Subscribers</SelectItem>
                <SelectItem value="yearly">Yearly Subscribers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Content (HTML)</label>
            <Textarea
              placeholder="<p>Your newsletter content here...</p>"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
            />
          </div>

          <Button onClick={handleSend} disabled={loading || !formData.title || !formData.content}>
            {loading ? "Sending..." : "Send Newsletter"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
