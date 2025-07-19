"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2, Users, Zap } from "lucide-react"
import type { Provider, API } from "@/types/database"
import { ApiService } from "@/lib/api-service"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ProviderDashboardProps {
  provider: Provider
  apis: API[]
  apiUsage: { apiId: string; apiName: string; usageData: any[] }[]
}

export function ProviderDashboard({ provider, apis, apiUsage }: ProviderDashboardProps) {
  const router = useRouter()
  const [newApiForm, setNewApiForm] = useState({
    name: "",
    slug: "",
    description: "",
    longDescription: "",
    baseUrl: "",
    documentationUrl: "",
    supportUrl: "",
    termsUrl: "",
    privacyUrl: "",
  })

  const handleCreateApi = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const createdApi = await ApiService.createApi({
        ...newApiForm,
        provider_id: provider.id,
      })
      if (createdApi) {
        toast({
          title: "API Created",
          description: `${createdApi.name} has been successfully created.`,
        })
        setNewApiForm({
          name: "",
          slug: "",
          description: "",
          longDescription: "",
          baseUrl: "",
          documentationUrl: "",
          supportUrl: "",
          termsUrl: "",
          privacyUrl: "",
        })
        router.refresh() // Revalidate data
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create API: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteApi = async (apiId: string, apiName: string) => {
    if (window.confirm(`Are you sure you want to delete ${apiName}? This action cannot be undone.`)) {
      try {
        await ApiService.deleteApi(apiId)
        toast({
          title: "API Deleted",
          description: `${apiName} has been successfully deleted.`,
        })
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to delete API: ${error.message}`,
          variant: "destructive",
        })
      }
    }
  }

  const chartConfig = {
    requests: {
      label: "Requests",
      color: "hsl(var(--primary))",
    },
    errors: {
      label: "Errors",
      color: "hsl(var(--destructive))",
    },
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Provider Studio: {provider.name}</h1>
      <p className="text-gray-600">{provider.description}</p>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apis">My APIs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apis.length}</div>
                <p className="text-xs text-muted-foreground">APIs managed by you</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {apis.reduce((sum, api) => sum + (api.total_subscribers || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Across all your APIs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests (Last 30 Days)</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {apiUsage
                    .reduce((total, api) => total + api.usageData.reduce((sum, data) => sum + data.requests, 0), 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Across all your APIs</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your APIs</CardTitle>
              <CardDescription>Manage your existing APIs or create new ones.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apis.map((api) => (
                    <TableRow key={api.id}>
                      <TableCell className="font-medium">{api.name}</TableCell>
                      <TableCell>{api.slug}</TableCell>
                      <TableCell>{api.status}</TableCell>
                      <TableCell>{api.total_subscribers}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteApi(api.id, api.name)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create New API</CardTitle>
              <CardDescription>Fill in the details to list a new API on the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateApi} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiName">API Name</Label>
                    <Input
                      id="apiName"
                      value={newApiForm.name}
                      onChange={(e) => setNewApiForm({ ...newApiForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiSlug">API Slug</Label>
                    <Input
                      id="apiSlug"
                      value={newApiForm.slug}
                      onChange={(e) => setNewApiForm({ ...newApiForm, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiDescription">Short Description</Label>
                  <Textarea
                    id="apiDescription"
                    value={newApiForm.description}
                    onChange={(e) => setNewApiForm({ ...newApiForm, description: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiLongDescription">Long Description</Label>
                  <Textarea
                    id="apiLongDescription"
                    value={newApiForm.longDescription}
                    onChange={(e) => setNewApiForm({ ...newApiForm, longDescription: e.target.value })}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiBaseUrl">Base URL</Label>
                  <Input
                    id="apiBaseUrl"
                    type="url"
                    value={newApiForm.baseUrl}
                    onChange={(e) => setNewApiForm({ ...newApiForm, baseUrl: e.target.value })}
                    placeholder="https://api.example.com/v1"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiDocsUrl">Documentation URL</Label>
                    <Input
                      id="apiDocsUrl"
                      type="url"
                      value={newApiForm.documentationUrl}
                      onChange={(e) => setNewApiForm({ ...newApiForm, documentationUrl: e.target.value })}
                      placeholder="https://docs.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiSupportUrl">Support URL</Label>
                    <Input
                      id="apiSupportUrl"
                      type="url"
                      value={newApiForm.supportUrl}
                      onChange={(e) => setNewApiForm({ ...newApiForm, supportUrl: e.target.value })}
                      placeholder="https://support.example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiTermsUrl">Terms URL</Label>
                    <Input
                      id="apiTermsUrl"
                      type="url"
                      value={newApiForm.termsUrl}
                      onChange={(e) => setNewApiForm({ ...newApiForm, termsUrl: e.target.value })}
                      placeholder="https://example.com/terms"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiPrivacyUrl">Privacy URL</Label>
                    <Input
                      id="apiPrivacyUrl"
                      type="url"
                      value={newApiForm.privacyUrl}
                      onChange={(e) => setNewApiForm({ ...newApiForm, privacyUrl: e.target.value })}
                      placeholder="https://example.com/privacy"
                    />
                  </div>
                </div>
                <Button type="submit">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create API
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Analytics (Last 30 Days)</CardTitle>
              <CardDescription>View request and error trends for your APIs.</CardDescription>
            </CardHeader>
            <CardContent>
              {apiUsage.length > 0 ? (
                apiUsage.map((apiData) => (
                  <div key={apiData.apiId} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">{apiData.apiName}</h3>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={apiData.usageData}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="requests"
                            stroke="var(--color-requests)"
                            activeDot={{ r: 8 }}
                          />
                          <Line type="monotone" dataKey="errors" stroke="var(--color-errors)" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No usage data available for your APIs yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Profile Settings</CardTitle>
              <CardDescription>Update your provider information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="providerName">Provider Name</Label>
                  <Input id="providerName" value={provider.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerSlug">Provider Slug</Label>
                  <Input id="providerSlug" value={provider.slug} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerDescription">Description</Label>
                  <Textarea id="providerDescription" value={provider.description || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerWebsite">Website URL</Label>
                  <Input id="providerWebsite" type="url" value={provider.website || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerSupportEmail">Support Email</Label>
                  <Input id="providerSupportEmail" type="email" value={provider.supportEmail || ""} />
                </div>
                <Button type="submit">Save Settings</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
