import type { NextRequest, NextResponse } from "next/server"
import type { Api, ApiKey } from "./database"

export interface GatewayRequest {
  request: NextRequest
  pathSegments: string[]
  host: string | null
  apiKey: string
  ipAddress: string
  userAgent: string
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  timestamp: Date
  userId?: string
  apiId?: string
}

export interface GatewayResponse {
  status: number
  headers: Record<string, string>
  body: string | null
  responseTime: number
  id: string
  statusCode: number
  responseTime: number
  timestamp: Date
}

export interface GatewayContext {
  request: NextRequest
  api: Api | null
  apiKey: string
  apiKeyRecord: ApiKey | null
  ipAddress: string
  userAgent: string
  apiPath: string
  config: any
  logger: any
  metrics: any
  response: NextResponse | null
}

export interface GatewayMiddleware {
  execute(context: GatewayContext): Promise<void>
}

export interface ApiResolutionResult {
  api: Api | null
  apiPath: string
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
  requests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface QuotaConfig {
  dailyLimit: number
  monthlyLimit: number
  monthly: number
  daily: number
  hourly: number
}

export interface SecurityConfig {
  allowedOrigins: string[]
  blockedIps: string[]
  requireHttps: boolean
  allowedMethods: string[]
  allowedHeaders: string[]
  maxRequestSize: number
  helmet: boolean
  compression: boolean
}

export interface CorsConfig {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
  credentials: boolean
  maxAge: number
  origin: string[]
  methods: string[]
  allowedHeaders: string[]
}

export interface GatewayConfig {
  port: number
  host: string
  cors: CorsConfig
  rateLimit: RateLimitConfig
  quota: QuotaConfig
  security: SecurityConfig
  logging: {
    level: "debug" | "info" | "warn" | "error"
    enableRequestLogging: boolean
    enableErrorLogging: boolean
  }
  metrics: {
    enabled: boolean
    endpoint: string
  }
  health: {
    endpoint: string
    checks: string[]
  }
  loadBalancer: LoadBalancerConfig
  cache: CacheConfig
}

export interface ApiEndpoint {
  id: string
  apiId: string
  path: string
  method: string
  description?: string
  parameters?: ApiParameter[]
  responses?: ApiResponse[]
  isActive: boolean
}

export interface ApiParameter {
  name: string
  type: "string" | "number" | "boolean" | "object" | "array"
  required: boolean
  description?: string
  example?: any
}

export interface ApiResponse {
  statusCode: number
  description: string
  schema?: any
  example?: any
}

export interface GatewayMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
  activeConnections: number
  uptime: number
  totalRequests: number
  totalErrors: number
  avgResponseTime: number
  requestsPerSecond: number
  errorRate: number
}

export interface GatewayLogEntry {
  timestamp: Date
  level: "debug" | "info" | "warn" | "error"
  message: string
  apiKeyId?: string
  apiId?: string
  responseTime?: number
  statusCode?: number
  ipAddress?: string
  userAgent?: string
  error?: Error
}

export interface AnalyticsEvent {
  id: string
  type: "request" | "response" | "error"
  apiId: string
  userId?: string
  apiKeyId?: string
  timestamp: Date
  data: any
}

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded"
  timestamp: Date
  checks: {
    database: boolean
    redis: boolean
    apis: boolean
  }
  responseTime: number
}

export interface LoadBalancerConfig {
  strategy: "round-robin" | "least-connections" | "weighted"
  healthCheck: {
    enabled: boolean
    interval: number
    timeout: number
    retries: number
  }
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: "lru" | "fifo" | "lfu"
}
