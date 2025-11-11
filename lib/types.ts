import type { ObjectId } from "mongodb"

// User Types
export interface User {
  _id?: ObjectId
  email: string
  name?: string
  image?: string
  role: "provider" | "consumer" | "admin"
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date
}

// Organization Types
export interface Organization {
  _id?: ObjectId
  name: string
  slug: string
  description?: string
  logo?: string
  ownerId: ObjectId
  members: {
    userId: ObjectId
    role: "owner" | "admin" | "member"
    joinedAt: Date
  }[]
  webhookUrl?: string
  webhookSecret?: string
  createdAt: Date
  updatedAt: Date
}

// API Types
export interface API {
  _id?: ObjectId
  name: string
  slug: string
  description: string
  documentation?: string
  organizationId: ObjectId
  baseUrl: string
  status: "active" | "inactive" | "deprecated"
  version: string
  authentication: "api_key" | "oauth" | "jwt" | "basic"
  rateLimit?: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  endpoints: APIEndpoint[]
  createdAt: Date
  updatedAt: Date
}

export interface APIEndpoint {
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  description: string
  requiresAuth: boolean
}

// Plan Types
export interface Plan {
  _id?: ObjectId
  apiId: ObjectId
  name: string
  slug: string
  description: string
  price: number
  currency: "USD" | "EUR" | "GBP"
  billingCycle: "monthly" | "yearly"
  rateLimit: number
  requestsPerDay: number
  features: string[]
  status: "active" | "inactive"
  trialDays?: number
  createdAt: Date
  updatedAt: Date
}

// Subscription Types
export interface Subscription {
  _id?: ObjectId
  userId: ObjectId
  apiId: ObjectId
  planId: ObjectId
  organizationId: ObjectId
  status: "active" | "cancelled" | "suspended" | "trial"
  apiKey: string
  apiKeyHash: string
  startDate: Date
  renewalDate: Date
  cancelledAt?: Date
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Billing Types
export interface Invoice {
  _id?: ObjectId
  subscriptionId: ObjectId
  userId: ObjectId
  amount: number
  currency: string
  status: "paid" | "pending" | "failed" | "cancelled"
  paypalTransactionId?: string
  description: string
  dueDate: Date
  paidDate?: Date
  invoiceNumber: string
  lineItems: {
    description: string
    quantity: number
    unitPrice: number
  }[]
  createdAt: Date
  updatedAt: Date
}

// Usage/Analytics Types
export interface Usage {
  _id?: ObjectId
  subscriptionId: ObjectId
  apiId: ObjectId
  userId: ObjectId
  requestCount: number
  date: Date
  statusCodes: Record<string, number>
  avgResponseTime: number
}

// API Key Types
export interface APIKey {
  _id?: ObjectId
  userId: ObjectId
  subscriptionId: ObjectId
  key: string
  keyHash: string
  lastUsed?: Date
  status: "active" | "revoked"
  createdAt: Date
  updatedAt: Date
}

// Advanced Features Types
export interface APIRating {
  _id?: ObjectId
  apiId: ObjectId
  userId: ObjectId
  rating: number
  review: string
  status: "approved" | "pending" | "rejected"
  helpful: number
  createdAt: Date
  updatedAt: Date
}

export interface APIScore {
  _id?: ObjectId
  apiId: ObjectId
  responseTime: number
  reliability: number
  documentation: number
  features: number
  support: number
  overallScore: number
  lastUpdated: Date
}

export interface Credit {
  _id?: ObjectId
  userId: ObjectId
  amount: number
  used: number
  available: number
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface SupportTicket {
  _id?: ObjectId
  userId: ObjectId
  subject: string
  description: string
  category: "billing" | "technical" | "account" | "general"
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in-progress" | "waiting-customer" | "resolved" | "closed"
  attachments?: string[]
  messages: {
    userId: ObjectId
    message: string
    isAdmin: boolean
    createdAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface Newsletter {
  _id?: ObjectId
  userId: ObjectId
  frequency: "none" | "daily" | "weekly" | "yearly"
  categories: string[]
  subscribedAt: Date
  unsubscribedAt?: Date
}

export interface StatusPageComponent {
  _id?: ObjectId
  name: string
  status: "operational" | "degraded" | "partial_outage" | "major_outage"
  description: string
  lastUpdated: Date
}

export interface SystemStatus {
  _id?: ObjectId
  status: "operational" | "degraded" | "maintenance" | "incident"
  statusPage: string
  components: StatusPageComponent[]
  incidentCount: number
  avgUptime: number
  lastUpdated: Date
}

export interface OverageCharge {
  _id?: ObjectId
  subscriptionId: ObjectId
  userId: ObjectId
  requests: number
  chargePerRequest: number
  totalCharge: number
  invoiceId?: ObjectId
  status: "pending" | "billed" | "paid"
  billingPeriod: {
    startDate: Date
    endDate: Date
  }
  createdAt: Date
}
