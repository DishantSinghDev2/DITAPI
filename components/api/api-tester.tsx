"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import type { API, UserApiKey } from "@/types/api"
import { ApiService } from "@/lib/api-service"
import { useSession } from "@/lib/auth/session" // Assuming a client-side hook for session

interface ApiTesterProps {
  api: API
}

export function ApiTester({ api }: ApiTesterProps) {
  const { user } = useSession()
  const [method, setMethod] = useState("GET")
  const [endpoint, setEndpoint] = useState("")
  const [headers, setHeaders] = useState("")
  const [body, setBody] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>([])
  const [selectedApiKey, setSelectedApiKey] = useState<string>("")

  useEffect(() => {
    const fetchKeys = async () => {
      if (user?.id) {
        // This needs to be refined: fetch keys for a specific application, not all user keys
        // For now, let's assume a dummy application ID or fetch all keys and filter.
        // This is a placeholder for actual application-specific key fetching.
        const dummyApplicationId = "some-application-id" // Replace with actual application ID
        const keys = await ApiService.getUserApiKeys(dummyApplicationId)
        const apiSpecificKeys = keys.filter((key) => key.apiId === api.id)
        setUserApiKeys(apiSpecificKeys)
        if (apiSpecificKeys.length > 0) {
          setSelectedApiKey(apiSpecificKeys[0].keyValue)
        }
      }
    }
    fetchKeys()
  }, [user?.id, api.id])

  const handleTestApi = async () => {
    setLoading(true)
    setResponse(null)
    setError(null)

    try {
      const parsedHeaders = headers
        .split("\n")
        .filter(Boolean)
        .reduce(
          (acc, line) => {
            const [key, value] = line.split(":")
            if (key && value) {
              acc[key.trim()] = value.trim()
            }
            return acc
          },
          {} as Record<string, string>,
        )

      // Add the selected API key to headers if available
      if (selectedApiKey) {
        parsedHeaders["X-API-Key"] = selectedApiKey // Common header for API keys
        // Or parsedHeaders['Authorization'] = `Bearer ${selectedApiKey}`; depending on API
      }

      // Construct the full URL for the gateway
      // The gateway route is /api/gateway/[...path]
      // The endpoint here is relative to the API's base URL, e.g., /users
      // So the full path to the gateway would be /api/gateway/{api.slug}{endpoint}
      const gatewayBase = process.env.NEXT_PUBLIC_DITAPI_SUBDOMAIN_BASE ? `/api/gateway/` : `/api/gateway/`
      const fullGatewayUrl = `${gatewayBase}${api.slug}${endpoint}`

      const res = await fetch(fullGatewayUrl, {
        method,
        headers: parsedHeaders,
        body: method !== "GET" && method !== "HEAD" ? body : undefined,
      })

      const data = await res.json()
      setResponse(data)

      if (!res.ok) {
        setError(`API Error: ${res.status} ${res.statusText}`)
        toast({
          title: "API Test Failed",
          description: `Status: ${res.status}. ${data.message || "An error occurred."}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "API Test Successful",
          description: "The API call returned a successful response.",
        })
      }
    } catch (err: any) {
      setError(`Network Error: ${err.message}`)
      toast({
        title: "API Test Error",
        description: `A network error occurred: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test {api.name} Endpoint</CardTitle>
        <CardDescription>Make live calls to the API through the DITAPI Gateway.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="method">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Select method" />
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
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="endpoint">Endpoint (relative to API Base URL)</Label>
            <Input id="endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="/users" />
            <p className="text-sm text-muted-foreground">
              Full Gateway URL:{" "}
              <span className="font-mono">
                {process.env.NEXT_PUBLIC_DITAPI_SUBDOMAIN_BASE ? `/api/gateway/` : `/api/gateway/`}
                {api.slug}
                {endpoint}
              </span>
            </p>
          </div>
        </div>

        {userApiKeys.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">Your API Key</Label>
            <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
              <SelectTrigger id="apiKey">
                <SelectValue placeholder="Select an API Key" />
              </SelectTrigger>
              <SelectContent>
                {userApiKeys.map((key) => (
                  <SelectItem key={key.id} value={key.keyValue}>
                    {key.name || key.keyValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select an API key from your applications to authenticate your request.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="headers">Headers (one per line, e.g., Content-Type: application/json)</Label>
          <Textarea
            id="headers"
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            rows={5}
            placeholder="Authorization: Bearer YOUR_TOKEN"
          />
        </div>

        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <div className="space-y-2">
            <Label htmlFor="body">Request Body (JSON)</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder='{ "key": "value" }'
            />
          </div>
        )}

        <Button onClick={handleTestApi} disabled={loading}>
          {loading ? "Sending Request..." : "Send Request"}
        </Button>

        {error && (
          <div className="text-red-500 mt-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {response && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Response:</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96">
              <code>{JSON.stringify(response, null, 2)}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
