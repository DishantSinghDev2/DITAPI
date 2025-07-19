import { db } from "./connection"
import {
  users,
  apis,
  providers,
  apiCategories,
  categories,
  pricingPlans,
  subscriptions,
  applications,
  userApiKeys,
  reviews,
} from "./schema"
import { eq, and, desc, sql, count, asc } from "drizzle-orm"
import type {
  User,
  API,
  Provider,
  Category,
  PricingPlan,
  Subscription,
  Application,
  UserApiKey,
  Review,
  NewUser,
  NewAPI,
  NewProvider,
  NewPricingPlan,
  NewSubscription,
  NewApplication,
  NewUserApiKey,
  NewReview,
  UpdateUser,
  UpdateAPI,
  UpdateProvider,
  UpdatePricingPlan,
  UpdateSubscription,
  UpdateApplication,
  UpdateReview,
} from "@/types/database"

// --- User Queries ---
export async function createUser(user: NewUser): Promise<User | undefined> {
  const [newUser] = await db.insert(users).values(user).returning()
  return newUser
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user
}

export async function updateUser(id: string, data: UpdateUser): Promise<User | undefined> {
  const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning()
  return updatedUser
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id))
}

// --- API Queries ---
export async function createApi(api: NewAPI): Promise<API | undefined> {
  const [newApi] = await db.insert(apis).values(api).returning()
  return newApi
}

export async function getApiById(id: string): Promise<API | undefined> {
  const [api] = await db.select().from(apis).where(eq(apis.id, id)).limit(1)
  return api
}

export async function getApiBySlug(slug: string): Promise<API | undefined> {
  const [api] = await db.select().from(apis).where(eq(apis.slug, slug)).limit(1)
  return api
}

export async function getApiBySubdomain(subdomain: string): Promise<API | undefined> {
  // Assuming subdomain is derived from API slug or a dedicated field
  // For now, let's assume subdomain directly maps to slug for simplicity
  const [api] = await db.select().from(apis).where(eq(apis.slug, subdomain)).limit(1)
  return api
}

export async function getAllApis(limit = 10, offset = 0, categorySlug?: string, searchTerm?: string): Promise<API[]> {
  let query = db.select().from(apis).$dynamic()

  if (categorySlug) {
    query = query
      .innerJoin(apiCategories, eq(apis.id, apiCategories.apiId))
      .innerJoin(categories, eq(apiCategories.categoryId, categories.id))
      .where(eq(categories.slug, categorySlug))
  }

  if (searchTerm) {
    query = query.where(
      sql`${apis.name} ILIKE ${"%" + searchTerm + "%"} OR ${apis.description} ILIKE ${"%" + searchTerm + "%"}`,
    )
  }

  const result = await query.limit(limit).offset(offset)
  return result.map((row) => (categorySlug ? row.apis : row)) // Adjust for join result
}

export async function countAllApis(categorySlug?: string, searchTerm?: string): Promise<number> {
  let query = db.select({ count: count() }).from(apis).$dynamic()

  if (categorySlug) {
    query = query
      .innerJoin(apiCategories, eq(apis.id, apiCategories.apiId))
      .innerJoin(categories, eq(apiCategories.categoryId, categories.id))
      .where(eq(categories.slug, categorySlug))
  }

  if (searchTerm) {
    query = query.where(
      sql`${apis.name} ILIKE ${"%" + searchTerm + "%"} OR ${apis.description} ILIKE ${"%" + searchTerm + "%"}`,
    )
  }

  const result = await query
  return result[0]?.count || 0
}

export async function updateApi(id: string, data: UpdateAPI): Promise<API | undefined> {
  const [updatedApi] = await db.update(apis).set(data).where(eq(apis.id, id)).returning()
  return updatedApi
}

export async function deleteApi(id: string): Promise<void> {
  await db.delete(apis).where(eq(apis.id, id))
}

export async function getFeaturedApis(limit = 5): Promise<API[]> {
  return db.select().from(apis).where(eq(apis.is_featured, true)).limit(limit)
}

// --- Provider Queries ---
export async function createProvider(provider: NewProvider): Promise<Provider | undefined> {
  const [newProvider] = await db.insert(providers).values(provider).returning()
  return newProvider
}

export async function getProviderById(id: string): Promise<Provider | undefined> {
  const [provider] = await db.select().from(providers).where(eq(providers.id, id)).limit(1)
  return provider
}

export async function getProviderBySlug(slug: string): Promise<Provider | undefined> {
  const [provider] = await db.select().from(providers).where(eq(providers.slug, slug)).limit(1)
  return provider
}

export async function getAllProviders(): Promise<Provider[]> {
  return db.select().from(providers)
}

export async function updateProvider(id: string, data: UpdateProvider): Promise<Provider | undefined> {
  const [updatedProvider] = await db.update(providers).set(data).where(eq(providers.id, id)).returning()
  return updatedProvider
}

export async function deleteProvider(id: string): Promise<void> {
  await db.delete(providers).where(eq(providers.id, id))
}

// --- Category Queries ---
export async function createCategory(category: Category): Promise<Category | undefined> {
  const [newCategory] = await db.insert(categories).values(category).returning()
  return newCategory
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  return category
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1)
  return category
}

export async function getAllCategories(): Promise<Category[]> {
  return db.select().from(categories)
}

// --- Pricing Plan Queries ---
export async function createPricingPlan(plan: NewPricingPlan): Promise<PricingPlan | undefined> {
  const [newPlan] = await db.insert(pricingPlans).values(plan).returning()
  return newPlan
}

export async function getPricingPlanById(id: string): Promise<PricingPlan | undefined> {
  const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, id)).limit(1)
  return plan
}

export async function getPricingPlansForApi(apiId: string): Promise<PricingPlan[]> {
  return db.select().from(pricingPlans).where(eq(pricingPlans.apiId, apiId)).orderBy(asc(pricingPlans.price_monthly))
}

export async function updatePricingPlan(id: string, data: UpdatePricingPlan): Promise<PricingPlan | undefined> {
  const [updatedPlan] = await db.update(pricingPlans).set(data).where(eq(pricingPlans.id, id)).returning()
  return updatedPlan
}

export async function deletePricingPlan(id: string): Promise<void> {
  await db.delete(pricingPlans).where(eq(pricingPlans.id, id))
}

// --- Subscription Queries ---
export async function createSubscription(subscription: NewSubscription): Promise<Subscription | undefined> {
  const [newSubscription] = await db.insert(subscriptions).values(subscription).returning()
  return newSubscription
}

export async function getSubscriptionById(id: string): Promise<Subscription | undefined> {
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1)
  return subscription
}

export async function getActiveSubscriptionForUserAndApi(
  userId: string,
  apiId: string,
): Promise<Subscription | undefined> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.apiId, apiId), eq(subscriptions.status, "active")))
    .limit(1)
  return subscription
}

export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  return db.select().from(subscriptions).where(eq(subscriptions.userId, userId))
}

export async function updateSubscription(id: string, data: UpdateSubscription): Promise<Subscription | undefined> {
  const [updatedSubscription] = await db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning()
  return updatedSubscription
}

export async function deleteSubscription(id: string): Promise<void> {
  await db.delete(subscriptions).where(eq(subscriptions.id, id))
}

// --- Application Queries ---
export async function createApplication(app: NewApplication): Promise<Application | undefined> {
  const [newApp] = await db.insert(applications).values(app).returning()
  return newApp
}

export async function getApplicationById(id: string): Promise<Application | undefined> {
  const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1)
  return app
}

export async function getUserApplications(userId: string): Promise<Application[]> {
  return db.select().from(applications).where(eq(applications.userId, userId))
}

export async function updateApplication(id: string, data: UpdateApplication): Promise<Application | undefined> {
  const [updatedApp] = await db.update(applications).set(data).where(eq(applications.id, id)).returning()
  return updatedApp
}

export async function deleteApplication(id: string): Promise<void> {
  await db.delete(applications).where(eq(applications.id, id))
}

// --- User API Key Queries ---
export async function createUserApiKey(key: NewUserApiKey): Promise<UserApiKey | undefined> {
  const [newKey] = await db.insert(userApiKeys).values(key).returning()
  return newKey
}

export async function getUserApiKeys(applicationId: string): Promise<UserApiKey[]> {
  return db.select().from(userApiKeys).where(eq(userApiKeys.applicationId, applicationId))
}

export async function getUserApiKeyByValue(keyValue: string): Promise<UserApiKey | undefined> {
  const [key] = await db.select().from(userApiKeys).where(eq(userApiKeys.keyValue, keyValue)).limit(1)
  return key
}

export async function deleteUserApiKey(id: string): Promise<void> {
  await db.delete(userApiKeys).where(eq(userApiKeys.id, id))
}

// --- Review Queries ---
export async function createReview(review: NewReview): Promise<Review | undefined> {
  const [newReview] = await db.insert(reviews).values(review).returning()
  return newReview
}

export async function getReviewsForApi(apiId: string): Promise<Review[]> {
  return db.select().from(reviews).where(eq(reviews.apiId, apiId)).orderBy(desc(reviews.createdAt))
}

export async function getReviewById(id: string): Promise<Review | undefined> {
  const [review] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
  return review
}

export async function updateReview(id: string, data: UpdateReview): Promise<Review | undefined> {
  const [updatedReview] = await db.update(reviews).set(data).where(eq(reviews.id, id)).returning()
  return updatedReview
}

export async function deleteReview(id: string): Promise<void> {
  await db.delete(reviews).where(eq(reviews.id, id))
}
