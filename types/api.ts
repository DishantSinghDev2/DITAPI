// Re-export all database types for convenience
export type {
  User,
  Provider,
  Category,
  API,
  PricingPlan,
  Subscription,
  Application,
  UserApiKey,
  APIUsage,
  APIRequest,
  Review,
  ApiCategory,
  PlatformStats,
  ApiMetrics,
  UsageData,
} from "./database"

// Additional API-specific types
export interface ApiKey {
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
}

export interface ApiSubscription {
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
  api?: {
    id: string
    name: string
    slug: string
    description: string
    logoUrl?: string
  }
  pricingPlan?: {
    id: string
    name: string
    price: number
    billingPeriod: string
    requestLimit: number
  }
  apiKeys?: ApiKey[]
}

export interface UserApplication {
  id: string
  userId: string
  name: string
  description?: string
  website?: string
  createdAt: Date
  updatedAt: Date
  apiKeys?: ApiKey[]
}

export interface CreateApplicationData {
  name: string
  description?: string
  website?: string
}

export interface CreateApiKeyData {
  applicationId: string
  apiId: string
  name?: string
}

export interface ApiKeyResponse {
  id: string
  name?: string
  keyValue: string
  keyPrefix: string
  isActive: boolean
  createdAt: Date
  expiresAt?: Date
}

export interface DashboardStats {
  totalApplications: number
  totalApiKeys: number
  totalSubscriptions: number
  monthlyRequests: number
}

export interface UsageMetrics {
  requests: number
  errors: number
  avgResponseTime: number
  dataTransferred: number
}
