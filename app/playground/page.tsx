"use client"

import { useState } from "react"
import { useSWR } from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function PlaygroundPage() {
  const [apiId, setApiId] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [method, setMethod] = useState("GET")
  const [headers, setHeaders] = useState("{}")
  const [body, setBody] = useState("")
  const [queryParams, setQueryParams] = useState("{}")
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Fetch user's subscribed APIs
  const { data: subscriptions } = useSWR("/api/consumer/subscriptions")

  const handleTest = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/playground/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId,
          endpointPath: endpoint,
          method,
          headers: JSON.parse(headers),
          body: body ? JSON.parse(body) : undefined,
          queryParams: JSON.parse(queryParams),
        }),
      })
      const data = await res.json()
      setResponse(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Playground</CardTitle>
              <CardDescription>Test your APIs in real-time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select API</label>
                <Select value={apiId} onValueChange={setApiId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an API" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptions?.data?.map((sub: any) => (
                      <SelectItem key={sub._id} value={sub._id}>
                        {sub.apiName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Method</label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Endpoint</label>
                  <Input placeholder="/endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Query Parameters (JSON)</label>
                <Textarea
                  placeholder="{}"
                  value={queryParams}
                  onChange={(e) => setQueryParams(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Headers (JSON)</label>
                <Textarea placeholder="{}" value={headers} onChange={(e) => setHeaders(e.target.value)} rows={3} />
              </div>

              <div>
                <label className="text-sm font-medium">Body (JSON)</label>
                <Textarea placeholder="{}" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
              </div>

              <Button onClick={handleTest} disabled={loading} className="w-full">
                {loading ? "Testing..." : "Send Request"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              {response ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="font-mono">Status: {response.status}</span>
                    <span className="text-sm text-muted-foreground">{response.duration}ms</span>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Response Body</label>
                    <pre className="bg-muted p-3 rounded overflow-auto max-h-96 text-xs">
                      {JSON.stringify(response.body, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Make a request to see response</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
