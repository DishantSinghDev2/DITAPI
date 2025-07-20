import type {
  API,
  Category,
  PricingPlan,
  Review,
  User,
  Subscription,
  Application,
  UserApiKey,
  Provider,
  APIUsage,
} from "@/types/database"
import {
  getAllApis,
  getApiById,
  getApiBySlug,
  getFeaturedApis,
  countAllApis,
  getAllCategories,
  getPricingPlansForApi,
  getReviewsForApi,
  getProviderById,
  getProviderBySlug,
  getAllProviders,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  createApi,
  updateApi,
  deleteApi,
  createProvider,
  updateProvider,
  deleteProvider,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  createSubscription,
  getSubscriptionById,
  getActiveSubscriptionForUserAndApi,
  getUserSubscriptions,
  updateSubscription,
  deleteSubscription,
  createApplication,
  getApplicationById,
  getUserApplications,
  updateApplication,
  deleteApplication,
  createUserApiKey,
  getUserApiKeys,
  getUserApiKeyByValue,
  deleteUserApiKey,
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  getApiBySubdomain,
  getPricingPlanById,
} from "@/lib/database/production-queries"

import {
  getDailyApiUsage,
  getTotalRequestsForApi,
  getApiLatencyMetrics,
  getApiErrorRate,
  getTopApisByUsage,
  getPlatformOverviewStats,
  getApiUsageByTime,
  getUserApiUsage,
} from "@/lib/database/stats-queries"

// This service layer acts as an abstraction over the database queries.
// It can include business logic, data transformation, and error handling.

export class ApiService {
  // --- User Operations ---
  static async createUser(
    user: Omit<User, "id" | "createdAt" | "updatedAt" | "isVerified" | "role">,
  ): Promise<User | undefined> {
    return createUser({ ...user, isVerified: false, role: "developer" })
  }

  static async getUserById(id: string): Promise<User | undefined> {
    return getUserById(id)
  }

  static async getUserByEmail(email: string): Promise<User | undefined> {
    return getUserByEmail(email)
  }

  static async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    return updateUser(id, data)
  }

  static async deleteUser(id: string): Promise<void> {
    return deleteUser(id)
  }

  static async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    // This would need to be implemented in production-queries.ts
    // For now, return empty array
    return []
  }

  // --- API Operations ---
  static async createApi(
    api: Omit<
      API,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "rating"
      | "totalSubscribers"
      | "averageLatency"
      | "uptimePercentage"
      | "status"
      | "isPublic"
      | "isFeatured"
    >,
  ): Promise<API | undefined> {
    return createApi({
      ...api,
      rating: 0,
      totalSubscribers: 0,
      averageLatency: 0,
      uptimePercentage: 100,
      status: "pending",
      isPublic: false,
      isFeatured: false,
    })
  }

  static async getApiById(id: string): Promise<API | undefined> {
    return getApiById(id)
  }

  static async getApiBySlug(slug: string): Promise<API | undefined> {
    return getApiBySlug(slug)
  }

  static async getApiBySubdomain(subdomain: string): Promise<API | undefined> {
    return getApiBySubdomain(subdomain)
  }

  static async getAllApis(limit = 10, offset = 0, categorySlug?: string, searchTerm?: string): Promise<API[]> {
    return getAllApis(limit, offset, categorySlug, searchTerm)
  }

  static async countAllApis(categorySlug?: string, searchTerm?: string): Promise<number> {
    return countAllApis(categorySlug, searchTerm)
  }

  static async updateApi(id: string, data: Partial<API>): Promise<API | undefined> {
    return updateApi(id, data)
  }

  static async deleteApi(id: string): Promise<void> {
    return deleteApi(id)
  }

  static async getFeaturedApis(limit = 5): Promise<API[]> {
    return getFeaturedApis(limit)
  }

  // --- Provider Operations ---
  static async createProvider(
    provider: Omit<Provider, "id" | "createdAt" | "updatedAt" | "isVerified">,
  ): Promise<Provider | undefined> {
    return createProvider({ ...provider, isVerified: false })
  }

  static async getProviderById(id: string): Promise<Provider | undefined> {
    return getProviderById(id)
  }

  static async getProviderBySlug(slug: string): Promise<Provider | undefined> {
    return getProviderBySlug(slug)
  }

  static async getAllProviders(): Promise<Provider[]> {
    return getAllProviders()
  }

  static async updateProvider(id: string, data: Partial<Provider>): Promise<Provider | undefined> {
    return updateProvider(id, data)
  }

  static async deleteProvider(id: string): Promise<void> {
    return deleteProvider(id)
  }

  // --- Category Operations ---
  static async createCategory(category: Omit<Category, "id">): Promise<Category | undefined> {
    return createCategory(category)
  }

  static async getCategoryById(id: string): Promise<Category | undefined> {
    return getCategoryById(id)
  }

  static async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return getCategoryBySlug(slug)
  }

  static async getAllCategories(): Promise<Category[]> {
    return getAllCategories()
  }

  // --- Pricing Plan Operations ---
  static async createPricingPlan(
    plan: Omit<PricingPlan, "id" | "createdAt" | "updatedAt">,
  ): Promise<PricingPlan | undefined> {
    return createPricingPlan(plan)
  }

  static async getPricingPlanById(id: string): Promise<PricingPlan | undefined> {
    return getPricingPlanById(id)
  }

  static async getPricingPlansForApi(apiId: string): Promise<PricingPlan[]> {
    return getPricingPlansForApi(apiId)
  }

  static async updatePricingPlan(id: string, data: Partial<PricingPlan>): Promise<PricingPlan | undefined> {
    return updatePricingPlan(id, data)
  }

  static async deletePricingPlan(id: string): Promise<void> {
    return deletePricingPlan(id)
  }

  // --- Subscription Operations ---
  static async createSubscription(
    subscription: Omit<
      Subscription,
      "id" | "createdAt" | "updatedAt" | "status" | "currentPeriodStart" | "currentPeriodEnd"
    >,
  ): Promise<Subscription | undefined> {
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1) // Default to 1 month subscription

    return createSubscription({
      ...subscription,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
    })
  }

  static async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    return getSubscriptionById(id)
  }

  static async getActiveSubscriptionForUserAndApi(userId: string, apiId: string): Promise<Subscription | undefined> {
    return getActiveSubscriptionForUserAndApi(userId, apiId)
  }

  static async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return getUserSubscriptions(userId)
  }

  static async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    return updateSubscription(id, data)
  }

  static async deleteSubscription(id: string): Promise<void> {
    return deleteSubscription(id)
  }

  // --- Application Operations ---
  static async createApplication(
    app: Omit<Application, "id" | "createdAt" | "updatedAt">,
  ): Promise<Application | undefined> {
    return createApplication(app)
  }

  static async getApplicationById(id: string): Promise<Application | undefined> {
    return getApplicationById(id)
  }

  static async getUserApplications(userId: string): Promise<Application[]> {
    return getUserApplications(userId)
  }

  static async updateApplication(id: string, data: Partial<Application>): Promise<Application | undefined> {
    return updateApplication(id, data)
  }

  static async deleteApplication(id: string): Promise<void> {
    return deleteApplication(id)
  }

  // --- User API Key Operations ---
  static async createUserApiKey(
    key: Omit<UserApiKey, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserApiKey | undefined> {
    return createUserApiKey(key)
  }

  static async getUserApiKeys(applicationId: string): Promise<UserApiKey[]> {
    return getUserApiKeys(applicationId)
  }

  static async getUserApiKeyByValue(keyValue: string): Promise<UserApiKey | undefined> {
    return getUserApiKeyByValue(keyValue)
  }

  static async deleteUserApiKey(id: string): Promise<void> {
    return deleteUserApiKey(id)
  }

  // --- Review Operations ---
  static async createReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<Review | undefined> {
    return createReview(review)
  }

  static async getReviewsForApi(apiId: string): Promise<Review[]> {
    return getReviewsForApi(apiId)
  }

  static async getReviewById(id: string): Promise<Review | undefined> {
    return getReviewById(id)
  }

  static async updateReview(id: string, data: Partial<Review>): Promise<Review | undefined> {
    return updateReview(id, data)
  }

  static async deleteReview(id: string): Promise<void> {
    return deleteReview(id)
  }

  // --- Stats Queries ---
  static async getDailyApiUsage(apiId: string, date: Date): Promise<APIUsage[]> {
    return getDailyApiUsage(apiId, date)
  }

  static async getTotalRequestsForApi(apiId: string): Promise<number> {
    return getTotalRequestsForApi(apiId)
  }

  static async getApiLatencyMetrics(apiId: string): Promise<{ avgLatency: number | null; maxLatency: number | null }> {
    return getApiLatencyMetrics(apiId)
  }

  static async getApiErrorRate(apiId: string): Promise<number> {
    return getApiErrorRate(apiId)
  }

  static async getTopApisByUsage(limit = 5): Promise<API[]> {
    return getTopApisByUsage(limit)
  }

  static async getPlatformOverviewStats(): Promise<{
    totalApis: number
    totalProviders: number
    totalUsers: number
    totalRequestsLast24h: number
  }> {
    return getPlatformOverviewStats()
  }

  static async getApiUsageByTime(
    apiId: string,
    interval: "hour" | "day" | "month",
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return getApiUsageByTime(apiId, interval, startDate, endDate)
  }

  static async getUserApiUsage(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return getUserApiUsage(userId, startDate, endDate)
  }
}
