
export interface APIEndpoint {
  id: string
  apiId: string
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  description?: string
  parameters?: any
  responseSchema?: any
  createdAt: Date
  updatedAt: Date
}

// Gateway specific types
export interface ApiKey {
  id: string
  userId: string
  applicationId: string
  name: string
  keyPrefix: string
  keyHash: string
  isActive: boolean
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Api {
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  providerId: string
  baseUrl: string
  documentationUrl?: string
  logoUrl?: string
  status: "active" | "inactive" | "pending" | "deprecated"
  rating: number
  totalSubscribers: number
  averageLatency: number
  uptimePercentage: number
  isPublic: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}

// API Subscription with extended fields
export interface ApiSubscription extends Subscription {
  api?: API
  pricingPlan?: PricingPlan
  apiKeys?: UserApiKey[]
}

// User Application with extended fields
export interface UserApplication extends Application {
  apiKeys?: UserApiKey[]
}


export interface User {
  id: string
  email: string
  username: string
  fullName?: string
  passwordHash: string
  role: "developer" | "provider" | "admin"
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Provider {
  id: string
  name: string
  slug: string
  description?: string
  website?: string
  supportEmail?: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

export interface API {
  id: string
  name: string
  slug: string
  description: string
  longDescription?: string
  providerId: string
  baseUrl: string
  documentationUrl?: string
  supportUrl?: string
  termsUrl?: string
  privacyUrl?: string
  rating: number
  totalSubscribers: number
  averageLatency: number
  uptimePercentage: number
  status: "pending" | "active" | "inactive" | "deprecated"
  isPublic: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
  provider?: Provider
  categories?: Category[]
  pricingPlans?: PricingPlan[]
}

export interface PricingPlan {
  id: string
  apiId: string
  name: string
  description?: string
  priceMonthly: number
  priceYearly: number
  requestsPerMonth: number
  rateLimitPerSecond: number
  isFree: boolean
  isPopular: boolean
  features?: string[]
  stripePriceIdMonthly?: string
  stripePriceIdYearly?: string
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  userId: string
  apiId: string
  pricingPlanId: string
  status: "active" | "cancelled" | "past_due" | "trialing"
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  createdAt: Date
  updatedAt: Date
  user?: User
  api?: API
  pricingPlan?: PricingPlan
}

export interface Application {
  id: string
  userId: string
  name: string
  description?: string
  redirectUris?: string[]
  createdAt: Date
  updatedAt: Date
  user?: User
  apiKeys?: UserApiKey[]
}

export interface UserApiKey {
  id: string
  applicationId: string
  apiId: string
  keyValue: string
  name?: string
  isActive: boolean
  createdAt: Date
  expiresAt?: Date
  lastUsedAt?: Date
  createdByUserId: string
  application?: Application
  api?: API
  createdBy?: User
}

export interface APIUsage {
  id: string
  apiId: string
  userId: string
  requests: number
  dataTransferred: number
  errors: number
  timestamp: Date
  api?: API
  user?: User
}

export interface APIRequest {
  id: string
  apiId: string
  userId: string
  method: string
  path: string
  statusCode: number
  latency?: number
  requestSize?: number
  responseSize?: number
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  api?: API
  user?: User
}

export interface Review {
  id: string
  apiId: string
  userId: string
  rating: number
  comment?: string
  createdAt: Date
  updatedAt: Date
  api?: API
  user?: User
}

export interface ApiCategory {
  apiId: string
  categoryId: string
}

// Additional types for the platform
export interface PlatformStats {
  totalApis: number
  totalProviders: number
  totalUsers: number
  totalRequestsLast24h: number
}

export interface ApiMetrics {
  totalRequests: number
  avgResponseTime: number
  errorRate: number
  lastHourRequests: number
}

export interface UsageData {
  time: string
  totalRequests: number
  avgResponseTime: number
  errorCount: number
}
