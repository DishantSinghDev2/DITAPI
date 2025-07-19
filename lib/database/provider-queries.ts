import { db } from "@/lib/database/connection"
import { providers, apis, apiCategories, categories } from "@/lib/database/schema"
import { eq, sql } from "drizzle-orm"
import type { Provider, Api } from "@/types/api"

// This file is now deprecated as all queries are consolidated into production-queries.ts
// This file is kept for reference but should not be used.

export async function getProviderByUserId(userId: string): Promise<Provider | null> {
  const result = await db.query.providers.findFirst({
    where: eq(providers.userId, userId),
  })
  return result || null
}

export async function getProviderById(providerId: string): Promise<Provider | null> {
  const result = await db.query.providers.findFirst({
    where: eq(providers.id, providerId),
  })
  return result || null
}

export async function updateProvider(providerId: string, data: Partial<Provider>): Promise<Provider | null> {
  const [updatedProvider] = await db
    .update(providers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(providers.id, providerId))
    .returning()
  return updatedProvider || null
}

export async function createProvider(data: Omit<Provider, "id" | "createdAt" | "updatedAt">): Promise<Provider | null> {
  const [newProvider] = await db.insert(providers).values(data).returning()
  return newProvider || null
}

export async function getApisByProviderId(providerId: string): Promise<Api[]> {
  const result = await db
    .select({
      id: apis.id,
      name: apis.name,
      slug: apis.slug,
      description: apis.description,
      longDescription: apis.longDescription,
      baseUrl: apis.baseUrl,
      documentationUrl: apis.documentationUrl,
      supportUrl: apis.supportUrl,
      termsUrl: apis.termsUrl,
      privacyUrl: apis.privacyUrl,
      rating: apis.rating,
      totalSubscribers: apis.totalSubscribers,
      averageLatency: apis.averageLatency,
      uptimePercentage: apis.uptimePercentage,
      status: apis.status,
      isPublic: apis.isPublic,
      isFeatured: apis.isFeatured,
      providerId: apis.providerId,
      createdAt: apis.createdAt,
      updatedAt: apis.updatedAt,
      categories: sql<Array<{ id: string; name: string }>>`
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
            FROM ${categories} c
            JOIN ${apiCategories} ac ON c.id = ac.category_id
            WHERE ac.api_id = ${apis.id}
          ),
          '[]'::json
        )
      `,
    })
    .from(apis)
    .where(eq(apis.providerId, providerId))
    .orderBy(apis.name)

  return result as Api[]
}

export async function createApiForProvider(
  providerId: string,
  apiData: Omit<
    Api,
    | "id"
    | "providerId"
    | "createdAt"
    | "updatedAt"
    | "rating"
    | "totalSubscribers"
    | "averageLatency"
    | "uptimePercentage"
  > & { categoryIds?: string[] },
): Promise<Api | null> {
  const { categoryIds, ...restApiData } = apiData
  const [newApi] = await db
    .insert(apis)
    .values({
      ...restApiData,
      providerId: providerId,
      status: "pending", // New APIs start as pending review
      isPublic: false, // Not public until approved
      isFeatured: false,
      rating: "0.00",
      totalSubscribers: 0,
      averageLatency: 0,
      uptimePercentage: "99.99",
    })
    .returning()

  if (newApi && categoryIds && categoryIds.length > 0) {
    const apiCategoryValues = categoryIds.map((categoryId) => ({
      apiId: newApi.id,
      categoryId: categoryId,
    }))
    await db.insert(apiCategories).values(apiCategoryValues)
  }

  return newApi || null
}

export async function updateApiForProvider(
  apiId: string,
  apiData: Partial<Omit<Api, "id" | "providerId" | "createdAt" | "updatedAt">> & { categoryIds?: string[] },
): Promise<Api | null> {
  const { categoryIds, ...restApiData } = apiData

  const [updatedApi] = await db
    .update(apis)
    .set({
      ...restApiData,
      updatedAt: new Date(),
    })
    .where(eq(apis.id, apiId))
    .returning()

  if (updatedApi && categoryIds !== undefined) {
    // Delete existing categories for this API
    await db.delete(apiCategories).where(eq(apiCategories.apiId, apiId))

    // Insert new categories
    if (categoryIds.length > 0) {
      const apiCategoryValues = categoryIds.map((categoryId) => ({
        apiId: updatedApi.id,
        categoryId: categoryId,
      }))
      await db.insert(apiCategories).values(apiCategoryValues)
    }
  }

  return updatedApi || null
}

export async function deleteApiForProvider(apiId: string): Promise<boolean> {
  const result = await db.delete(apis).where(eq(apis.id, apiId))
  return result.rowCount > 0
}
