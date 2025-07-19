"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Loader2, Copy, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getUserApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  generateApiKey,
  deleteApiKey,
  getUserSubscriptions,
  cancelSubscription,
} from "@/lib/actions/dashboard-actions"
import type { UserSession, UserApplication, ApiSubscription } from "@/types/api"
import { format } from "date-fns"
import { RealtimeAnalytics } from "./real-time-analytics"

interface DeveloperDashboardProps {
  user: UserSession
}

export function DeveloperDashboard({ user }: DeveloperDashboardProps) {
  const { toast } = useToast()
  const [applications, setApplications] = useState<UserApplication[]>([])
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [isAppDialogOpen, setIsAppDialogOpen] = useState(false)
  const [currentApp, setCurrentApp] = useState<UserApplication | null>(null)
  const [appFormState, setAppFormState] = useState<Partial<UserApplication>>({})
  const [isSubmittingApp, setIsSubmittingApp] = useState(false)
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  const [currentApiKeyAppId, setCurrentApiKeyAppId] = useState<string | null>(null)
  const [apiKeyName, setApiKeyName] = useState("")
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)

  useEffect(() => {
    fetchApplications()
    fetchSubscriptions()
  }, [user.id])

  const fetchApplications = async () => {
    setLoadingApps(true)
    const result = await getUserApplications(user.id)
    if (result.success && result.applications) {
      setApplications(result.applications)
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to load applications.",
        variant: "destructive",
      })
    }
    setLoadingApps(false)
  }

  const fetchSubscriptions = async () => {
    setLoadingSubs(true)
    const result = await getUserSubscriptions(user.id)
    if (result.success && result.subscriptions) {
      setSubscriptions(result.subscriptions)
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to load subscriptions.",
        variant: "destructive",
      })
    }
    setLoadingSubs(false)
  }

  const openAppDialog = (app?: UserApplication) => {
    if (app) {
      setCurrentApp(app)
      setAppFormState(app)
    } else {
      setCurrentApp(null)
      setAppFormState({ name: "", description: "", website: "" })
    }
    setIsAppDialogOpen(true)
  }

  const handleAppFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAppFormState({ ...appFormState, [e.target.name]: e.target.value })
  }

  const handleSaveApp = async () => {
    setIsSubmittingApp(true)
    let result
    if (currentApp) {
      result = await updateApplication(currentApp.id, appFormState as UserApplication)
    } else {
      result = await createApplication(user.id, appFormState as UserApplication)
    }

    if (result.success) {
      toast({
        title: "Success",
        description: `Application ${currentApp ? "updated" : "created"} successfully.`,
      })
      setIsAppDialogOpen(false)
      fetchApplications()
    } else {
      toast({
        title: "Error",
        description: result.message || `Failed to ${currentApp ? "update" : "create"} application.`,
        variant: "destructive",
      })
    }
    setIsSubmittingApp(false)
  }

  const handleDeleteApp = async (appId: string) => {
    if (
      window.confirm("Are you sure you want to delete this application? All associated API keys will also be deleted.")
    ) {
      const result = await deleteApplication(appId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Application deleted successfully.",
        })
        fetchApplications()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete application.",
          variant: "destructive",
        })
      }
    }
  }

  const openApiKeyDialog = (appId: string) => {
    setCurrentApiKeyAppId(appId)
    setApiKeyName("")
    setIsApiKeyDialogOpen(true)
  }

  const handleGenerateApiKey = async () => {
    if (!currentApiKeyAppId || !apiKeyName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for your API key.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingKey(true)
    const result = await generateApiKey(user.id, currentApiKeyAppId, apiKeyName)
    setIsGeneratingKey(false)

    if (result.success && result.apiKey) {
      toast({
        title: "API Key Generated",
        description: `Your new API key "${result.apiKey.keyPrefix}..." has been generated.`,
      })
      setIsApiKeyDialogOpen(false)
      fetchApplications() // Refresh applications to show new key
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to generate API key.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteApiKey = async (apiKeyId: string) => {
    if (window.confirm("Are you sure you want to delete this API key?")) {
      const result = await deleteApiKey(apiKeyId)
      if (result.success) {
        toast({
          title: "Success",
          description: "API key deleted successfully.",
        })
        fetchApplications() // Refresh applications to remove key
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete API key.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this subscription? It will remain active until the end of the current billing period.",
      )
    ) {
      const result = await cancelSubscription(subscriptionId)
      if (result.success) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been marked for cancellation at the end of the current period.",
        })
        fetchSubscriptions() // Refresh subscriptions
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to cancel subscription.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="applications">My Applications</TabsTrigger>
        <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.username}!</CardTitle>
            <CardDescription>Your personal dashboard for DITAPI.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Here you can manage your API applications, subscriptions, and view your usage analytics.
            </p>
            {/* TODO: Add some summary stats or quick links */}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="applications">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>My Applications</CardTitle>
            <Button onClick={() => openAppDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Application
            </Button>
          </CardHeader>
          <CardContent>
            {loadingApps ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <p className="mt-2 text-gray-600">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No applications created yet.</div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{app.name}</h3>
                        <p className="text-sm text-muted-foreground">{app.description}</p>
                        {app.website && (
                          <p className="text-xs text-muted-foreground">
                            <a href={app.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {app.website}
                            </a>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openAppDialog(app)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteApp(app.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium text-md mb-2">API Keys:</h4>
                      {app.apiKeys && app.apiKeys.length > 0 ? (
                        <div className="space-y-2">
                          {app.apiKeys.map((key) => (
                            <div key={key.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                              <div className="font-mono text-sm">
                                {key.name}: {key.keyPrefix}********************
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(key.keyPrefix + key.keyHash)}
                                >
                                  <Copy className="h-4 w-4 mr-1" /> Copy
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteApiKey(key.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No API keys for this application.</p>
                      )}
                      <Button size="sm" className="mt-3" onClick={() => openApiKeyDialog(app.id)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Generate New Key
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subscriptions">
        <Card>
          <CardHeader>
            <CardTitle>My Subscriptions</CardTitle>
            <CardDescription>Manage your active and past API subscriptions.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSubs ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <p className="mt-2 text-gray-600">Loading subscriptions...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">You have no active subscriptions.</div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <Card key={sub.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{sub.api?.name || "Unknown API"}</h3>
                        <p className="text-sm text-muted-foreground">Plan: {sub.pricingPlan?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">Status: {sub.status}</p>
                        <p className="text-sm text-muted-foreground">
                          Period: {format(new Date(sub.currentPeriodStart), "MMM dd, yyyy")} -{" "}
                          {format(new Date(sub.currentPeriodEnd), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div>
                        {sub.status === "active" && !sub.cancelAtPeriodEnd && (
                          <Button variant="outline" size="sm" onClick={() => handleCancelSubscription(sub.id)}>
                            Cancel Subscription
                          </Button>
                        )}
                        {sub.cancelAtPeriodEnd && (
                          <Button variant="secondary" size="sm" disabled>
                            Cancellation Pending
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium text-md mb-2">Usage Analytics:</h4>
                      {sub.api && sub.apiKeys && sub.apiKeys.length > 0 ? (
                        <RealtimeAnalytics apiKey={sub.apiKeys[0]} />
                      ) : (
                        <p className="text-sm text-muted-foreground">No API keys found for analytics.</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Application Dialog */}
      <Dialog open={isAppDialogOpen} onOpenChange={setIsAppDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentApp ? "Edit Application" : "Create New Application"}</DialogTitle>
            <DialogDescription>
              {currentApp ? "Make changes to your application here." : "Add a new application to manage your API keys."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSaveApp()
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appName" className="text-right">
                Name
              </Label>
              <Input
                id="appName"
                name="name"
                value={appFormState.name || ""}
                onChange={handleAppFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="appDescription"
                name="description"
                value={appFormState.description || ""}
                onChange={handleAppFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appWebsite" className="text-right">
                Website
              </Label>
              <Input
                id="appWebsite"
                name="website"
                value={appFormState.website || ""}
                onChange={handleAppFormChange}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmittingApp}>
                {isSubmittingApp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Application"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* API Key Generation Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Enter a name for your new API key. This key will be associated with the selected application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKeyName" className="text-right">
                Key Name
              </Label>
              <Input
                id="apiKeyName"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                placeholder="e.g., My Production Key"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsApiKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleGenerateApiKey} disabled={isGeneratingKey}>
              {isGeneratingKey ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                "Generate Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  // You might want to add a toast notification here
}
