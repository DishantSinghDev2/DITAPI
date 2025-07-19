"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Play, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateApiKey } from "@/lib/actions/api-key-actions"
import { getSession } from "@/lib/auth/session"
import type { Api, ApiKey, UserSession } from "@/types/api"
import { useEffect } from "react"
import { getApiKeysForUserAndApi } from "@/lib/database/dashboard-queries"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ApiTesterLiveProps {
  api: Api
}

export function ApiTesterLive({ api }: ApiTesterLiveProps) {
  const { toast } = useToast()
  const [method, setMethod] = useState("GET")
  const [path, setPath] = useState("/example/path") // Example path
  const [headers, setHeaders] = useState("")
  const [body, setBody] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [userApiKey, setUserApiKey] = useState<ApiKey | null>(null)
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null)

  useEffect(() => {
    checkUserSessionAndApiKey()
  }, [api.id])

  const checkUserSessionAndApiKey = async () => {
    const session = await getSession()
    if (session?.user) {
      setSessionUser(session.user)
      const keys = await getApiKeysForUserAndApi(session.user.id, api.id)
      if (keys.success && keys.apiKeys && keys.apiKeys.length > 0) {
        setUserApiKey(keys.apiKeys[0]) // Use the first active key
      }
    }
  }

  const handleGenerateApiKey = async () => {
    if (!sessionUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate an API key.",
        variant: "destructive",
      })
      return
    }

    setIsApiKeyDialogOpen(true)
  }

  const confirmGenerateApiKey = async (keyName: string) => {
    if (!sessionUser) return

    const result = await generateApiKey(sessionUser.id, api.id, keyName)
    if (result.success && result.apiKey) {
      setUserApiKey(result.apiKey)
      toast({
        title: "API Key Generated",
        description: "Your new API key has been generated successfully.",
      })
      setIsApiKeyDialogOpen(false)
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to generate API key.",
        variant: "destructive",
      })
    }
  }

  const handleTestApi = async () => {
    if (!userApiKey) {
      toast({
        title: "API Key Missing",
        description: "Please generate or select an API key to test this API.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResponse("Loading...")

    try {
      const requestHeaders = new Headers()
      requestHeaders.set("Content-Type", "application/json")
      requestHeaders.set("x-ditapi-key", userApiKey.keyPrefix + userApiKey.keyHash) // Use the DITAPI gateway key header

      // Parse custom headers
      if (headers) {
        headers.split("\n").forEach((line) => {
          const [key, value] = line.split(":")
          if (key && value) {
            requestHeaders.set(key.trim(), value.trim())
          }
        })
      }

      // Construct the full URL to the gateway
      // The gateway route is /api/gateway/[...path]
      // The path should be /api-slug/original-api-path
      const fullUrl = `/api/gateway/${api.slug}${path}`

      const res = await fetch(fullUrl, {
        method: method,
        headers: requestHeaders,
        body: method !== "GET" && method !== "HEAD" ? body : undefined,
      })

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResponse(`Error: ${error.message || "Failed to fetch"}`)
      toast({
        title: "API Test Failed",
        description: error.message || "An unexpected error occurred during API test.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "API Key copied to clipboard.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live API Tester</CardTitle>
        <CardDescription>Test API endpoints directly through the DITAPI Gateway.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Section */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">Your API Key</Label>
          {userApiKey ? (
            <div className="flex items-center space-x-2">
              <Input
                id="apiKey"
                type="text"
                value={`${userApiKey.keyPrefix}********************`}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(userApiKey.keyPrefix + userApiKey.keyHash)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Input id="apiKey" type="text" placeholder="No API Key generated for this API" readOnly />
              <Button onClick={handleGenerateApiKey}>Generate Key</Button>
            </div>
          )}
        </div>

        {/* Request Builder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Label htmlFor="method">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Select Method" />
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
          <div className="md:col-span-2">
            <Label htmlFor="path">Path (relative to API base URL)</Label>
            <Input
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/v1/users"
              className="font-mono"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="headers">Headers (Key:Value pairs, one per line)</Label>
          <Textarea
            id="headers"
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            placeholder={`Content-Type: application/json\nAccept: application/json`}
            rows={4}
            className="font-mono"
          />
        </div>

        {method !== "GET" && method !== "HEAD" && (
          <div>
            <Label htmlFor="body">Body (JSON)</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`{\n  "name": "New Item",\n  "value": 123\n}`}
              rows={6}
              className="font-mono"
            />
          </div>
        )}

        <Button onClick={handleTestApi} disabled={loading || !userApiKey}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Request...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Send Request
            </>
          )}
        </Button>

        {/* Response Viewer */}
        <div className="space-y-2">
          <Label htmlFor="response">Response</Label>
          <Textarea id="response" value={response} readOnly rows={10} className="font-mono bg-gray-50 text-gray-800" />
        </div>
      </CardContent>

      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>Give your new API key a name to help you identify it later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="keyName" className="text-right">
                Key Name
              </Label>
              <Input
                id="keyName"
                defaultValue="My New API Key"
                className="col-span-3"
                onBlur={(e) => {
                  const input = e.target as HTMLInputElement
                  confirmGenerateApiKey(input.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.target as HTMLInputElement
                    confirmGenerateApiKey(input.value)
                    e.preventDefault() // Prevent form submission
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsApiKeyDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const inputElement = document.getElementById("keyName") as HTMLInputElement
                if (inputElement) {
                  confirmGenerateApiKey(inputElement.value)
                }
              }}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
