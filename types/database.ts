export interface User {
  id: string
  name: string
  email: string
  role: "developer" | "provider" | "admin"
  avatar_url?: string
  created_at: Date
  updated_at: Date
}

export interface API {
  id: string
  name: string
  slug: string
  description: string
  category_id: string
  provider_id: string
  base_url: string
  documentation_url?: string
  logo_url?: string
  status: "active" | "inactive" | "deprecated"
  rating: number
  total_requests: number
  created_at: Date
  updated_at: Date
  category_name?: string
  category_slug?: string
  provider_name?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  api_count?: number
  created_at: Date
  updated_at: Date
}

export interface APIEndpoint {
  id: string
  api_id: string
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  description?: string
  parameters?: any
  response_schema?: any
  created_at: Date
  updated_at: Date
}

export interface Subscription {
  id: string
  user_id: string
  api_id: string
  plan_id: string
  status: "active" | "cancelled" | "expired"
  current_usage: number
  usage_limit: number
  created_at: Date
  updated_at: Date
}

export interface PricingPlan {
  id: string
  api_id: string
  name: string
  description?: string
  price: number
  billing_period: "monthly" | "yearly"
  request_limit: number
  features: string[]
  created_at: Date
  updated_at: Date
}
