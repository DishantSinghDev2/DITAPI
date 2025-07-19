"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

import { TableCell } from "@/components/ui/table"

import { TableBody } from "@/components/ui/table"

import { TableHead } from "@/components/ui/table"

import { TableRow } from "@/components/ui/table"

import { TableHeader } from "@/components/ui/table"

import { Table } from "@/components/ui/table"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code, Users, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ApiService } from "@/lib/api-service"
import type { API, User } from "@/types/database"

interface AdminDashboardProps {
  adminUser: User
  platformStats: {
    totalApis: number
    totalProviders: number
    totalUsers: number
    totalRequestsLast24h: number
  }
  topApisByUsage: API[]
  recentSignups: User[]
}

export function AdminDashboard({ adminUser, platformStats, topApisByUsage, recentSignups }: AdminDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  const handleApiStatusChange = async (apiId: string, newStatus: string) => {
    try {
      await ApiService.updateApi(apiId, { status: newStatus as API["status"] })
      toast({
        title: "API Status Updated",
        description: `API status changed to ${newStatus}.`,
      })
      router.refresh() // Revalidate data
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update API status: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleProviderVerification = async (providerId: string, isVerified: boolean) => {
    try {
      await ApiService.updateProvider(providerId, { is_verified: isVerified })
      toast({
        title: "Provider Status Updated",
        description: `Provider verification status changed to ${isVerified}.`,
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update provider status: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600">Overview and management of the DITAPI platform.</p>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apis">API Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="providers">Provider Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformStats.totalApis.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">APIs listed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformStats.totalProviders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Registered providers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests (24h)</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformStats.totalRequestsLast24h.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">API calls in last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 APIs by Usage</CardTitle>
                <CardDescription>Most frequently used APIs on the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>API Name</TableHead>
                      <TableHead>Subscribers</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topApisByUsage.map((api) => (
                      <TableRow key={api.id}>
                        <TableCell className="font-medium">{api.name}</TableCell>
                        <TableCell>{api.total_subscribers?.toLocaleString()}</TableCell>
                        <TableCell>{api.rating?.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent User Signups</CardTitle>
                <CardDescription>Newly registered users on the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSignups.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Management</CardTitle>
              <CardDescription>Review and manage all APIs on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Public</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* This would ideally fetch all APIs with provider names */}
                  {topApisByUsage.map(
                    (
                      api, // Using topApisByUsage as a placeholder for all APIs
                    ) => (
                      <TableRow key={api.id}>
                        <TableCell className="font-medium">{api.name}</TableCell>
                        <TableCell>{api.provider_id}</TableCell> {/* TODO: Fetch provider name */}
                        <TableCell>
                          <Badge variant={api.status === "active" ? "default" : "outline"}>{api.status}</Badge>
                        </TableCell>
                        <TableCell>{api.is_public ? "Yes" : "No"}</TableCell>
                        <TableCell>{api.is_featured ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleApiStatusChange(api.id, api.status === "active" ? "inactive" : "active")
                            }
                          >
                            {api.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSignups.map(
                    (
                      user, // Using recentSignups as a placeholder for all users
                    ) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.is_verified ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2 bg-transparent">
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Management</CardTitle>
              <CardDescription>Approve and manage API providers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider Name</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* This would ideally fetch all providers */}
                  {[
                    { id: "1", name: "OpenAI", website: "https://openai.com", is_verified: true },
                    { id: "2", name: "WeatherCorp", website: "https://weathercorp.com", is_verified: false },
                  ].map(
                    (
                      provider, // Placeholder
                    ) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>{provider.website}</TableCell>
                        <TableCell>{provider.is_verified ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProviderVerification(provider.id, !provider.is_verified)}
                          >
                            {provider.is_verified ? "Unverify" : "Verify"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
