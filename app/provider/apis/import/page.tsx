"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ImportAPIPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedOrg, setSelectedOrg] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const { data: orgs } = useSWR("/api/organizations")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedOrg) {
      setError("Please select an organization first")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("organizationId", selectedOrg)

      const res = await fetch("/api/apis/import", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Import failed")
        return
      }

      setResult(data)
      setTimeout(() => {
        router.push(`/provider/apis/${data.apiId}`)
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Import API with AI</CardTitle>
          <CardDescription>
            Upload your API documentation (PDF, Word, or text) and let AI extract all details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {result ? (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">API imported successfully! Redirecting...</AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-sm font-medium">Select Organization</label>
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs?.data?.map((org: any) => (
                      <SelectItem key={org._id} value={org._id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.json,.yaml,.yml"
                  onChange={handleFileUpload}
                  disabled={!selectedOrg || loading}
                  className="hidden"
                />
                <Button onClick={() => fileRef.current?.click()} disabled={!selectedOrg || loading} size="lg">
                  {loading ? "Processing..." : "Upload Documentation"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">PDF, Word, Text, JSON, or YAML files supported</p>
              </div>

              {result?.apiDetails && (
                <div className="space-y-4 p-4 bg-muted rounded">
                  <div>
                    <h4 className="font-semibold mb-2">Extracted Details</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Name:</strong> {result.apiDetails.name}
                      </p>
                      <p>
                        <strong>Base URL:</strong> {result.apiDetails.baseUrl}
                      </p>
                      <p>
                        <strong>Auth:</strong> {result.apiDetails.authentication}
                      </p>
                      <p>
                        <strong>Endpoints:</strong> {result.apiDetails.endpoints?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
