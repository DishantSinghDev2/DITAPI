"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

export default function ProviderAPIs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState("")
  const [apis, setApis] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    baseUrl: "",
    authentication: "api_key",
    version: "1.0.0",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchOrganizations()
    }
  }, [status, router])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations")
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        if (data.length > 0) {
          setSelectedOrg(data[0]._id)
          fetchAPIs(data[0]._id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAPIs = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/apis`)
      if (response.ok) {
        const data = await response.json()
        setApis(data)
      }
    } catch (error) {
      console.error("Failed to fetch APIs:", error)
    }
  }

  const handleCreateAPI = async () => {
    try {
      const response = await fetch("/api/apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedOrg,
          ...formData,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          name: "",
          slug: "",
          description: "",
          baseUrl: "",
          authentication: "api_key",
          version: "1.0.0",
        })
        fetchAPIs(selectedOrg)
      }
    } catch (error) {
      console.error("Failed to create API:", error)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">API Management</h1>

          {organizations.length > 0 && (
            <div className="mb-6 flex gap-4 items-center">
              <label className="text-sm font-medium">Organization:</label>
              <Select
                value={selectedOrg}
                onValueChange={(value) => {
                  setSelectedOrg(value)
                  fetchAPIs(value)
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org._id} value={org._id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create API
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New API</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="API Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                      placeholder="API Slug (e.g., my-api)"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <Input
                      placeholder="Base URL (e.g., https://api.example.com)"
                      value={formData.baseUrl}
                      onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    />
                    <Select
                      value={formData.authentication}
                      onValueChange={(value) => setFormData({ ...formData, authentication: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="oauth">OAuth 2.0</SelectItem>
                        <SelectItem value="jwt">JWT</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleCreateAPI} className="w-full">
                      Create API
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {apis.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Authentication</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apis.map((api) => (
                  <TableRow key={api._id}>
                    <TableCell className="font-medium">{api.name}</TableCell>
                    <TableCell>{api.version}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{api.status}</span>
                    </TableCell>
                    <TableCell>{api.authentication}</TableCell>
                    <TableCell>
                      <Link href={`/provider/apis/${api._id}`}>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No APIs created yet</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Your First API</Button>
              </DialogTrigger>
            </Dialog>
          </Card>
        )}
      </div>
    </div>
  )
}
