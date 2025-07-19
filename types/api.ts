import type {
  User,
  API,
  Category,
  PricingPlan,
  Subscription,
  Application,
  UserApiKey,
  Provider,
  Review,
} from "./database"

// Re-export database types for convenience
export type { User, API, Category, PricingPlan, Subscription, Application, UserApiKey, Provider, Review }

// --- Frontend Specific Types ---

// User session type (simplified for client-side use)
export interface UserSession {
  id: string
  email: string
  username: string
  fullName?: string
  role: "developer" | "provider" | "admin"
  isVerified: boolean
}

// Gateway Request/Response types
export interface GatewayRequest {
  method: string
  url: string
  headers: Record<string, string>
  body: string | null
  ip: string
}

export interface GatewayResponse {
  status: number
  headers: Record<string, string>
  body: string | null
}

// API Marketplace specific types
export interface ApiCardProps {
  api: API
}

export interface ApiDetailsProps {
  api: API
  pricingPlans: PricingPlan[]
  reviews: Review[]
}

export interface ApiTesterProps {
  api: API
  userApiKey?: UserApiKey
}

export interface ApiPricingProps {
  api: API
  pricingPlans: PricingPlan[]
  userSubscription?: Subscription
}

export interface ApiReviewsProps {
  api: API
  reviews: Review[]
  currentUser?: UserSession
}

// Dashboard specific types
export interface DeveloperDashboardProps {
  user: UserSession
  applications: Application[]
  subscriptions: Subscription[]
  apiUsage: any[] // Detailed usage stats
}

export interface ProviderDashboardProps {
  provider: Provider
  apis: API[]
  apiUsage: any[] // Detailed usage stats for provider's APIs
}

export interface AdminDashboardProps {
  platformStats: {
    totalApis: number
    totalProviders: number
    totalUsers: number
    totalRequestsLast24h: number
  }
  topApisByUsage: API[]
  recentSignups: User[]
}

// Auth form types
export interface AuthFormState {
  message: string
  success: boolean
  errors?: Record<string, string[]>
}
