"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ApiKey {
  _id: string
  apiId: string
  apiName?: string
  planId: string
  status: string
  lastUsedAt?: string
  createdAt: string
  keyPreview?: string
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const response = await fetch("/api/consumer/keys")
      const data = await response.json()
      setKeys(data.keys || [])
    } catch (error) {
      console.error("Error fetching keys:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (keyId: string) => {
    setCopied(keyId)
    setTimeout(() => setCopied(null), 2000)
  }

  const revokeKey = async (keyId: string) => {
    try {
      await fetch(`/api/keys/${keyId}`, { method: "DELETE" })
      fetchKeys()
    } catch (error) {
      console.error("Error revoking key:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">Manage your API credentials</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>Keep your keys secure. Never share them publicly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>API</TableHead>
                  <TableHead>Key Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key._id}>
                    <TableCell>{key.apiName || "API"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {key.keyPreview}...{" "}
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(key._id)}>
                        {copied === key._id ? "Copied" : "Copy"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.status === "active" ? "default" : "destructive"}>{key.status}</Badge>
                    </TableCell>
                    <TableCell>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => revokeKey(key._id)}>
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {keys.length === 0 && <div className="text-center py-8 text-muted-foreground">No API keys created yet</div>}
        </CardContent>
      </Card>
    </div>
  )
}
