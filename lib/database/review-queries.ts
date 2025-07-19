import { db } from "@/lib/database/connection"
import { apiReviews } from "@/lib/database/schema"
import { eq, and, desc } from "drizzle-orm"
import type { ApiReview } from "@/types/api"

// This file is now deprecated as all queries are consolidated into production-queries.ts
// This file is kept for reference but should not be used.

export async function getApiReviews(apiId: string): Promise<ApiReview[]> {
  const reviews = await db.query.apiReviews.findMany({
    where: eq(apiReviews.apiId, apiId),
    with: {
      user: {
        columns: {
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: desc(apiReviews.createdAt),
  })
  return reviews as ApiReview[]
}

export async function createApiReview(
  apiId: string,
  userId: string,
  rating: number,
  title?: string,
  comment?: string,
): Promise<ApiReview | null> {
  const [newReview] = await db
    .insert(apiReviews)
    .values({
      apiId,
      userId,
      rating,
      title,
      comment,
      isVerifiedPurchase: false, // This would be determined by actual subscription data
    })
    .returning()
  return newReview || null
}

export async function updateApiReview(
  reviewId: string,
  userId: string,
  data: Partial<Omit<ApiReview, "id" | "apiId" | "userId" | "createdAt">>,
): Promise<ApiReview | null> {
  const [updatedReview] = await db
    .update(apiReviews)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(apiReviews.id, reviewId), eq(apiReviews.userId, userId)))
    .returning()
  return updatedReview || null
}

export async function deleteApiReview(reviewId: string, userId: string): Promise<boolean> {
  const result = await db.delete(apiReviews).where(and(eq(apiReviews.id, reviewId), eq(apiReviews.userId, userId)))
  return result.rowCount > 0
}

export async function getReviewByUserAndApi(userId: string, apiId: string): Promise<ApiReview | null> {
  const review = await db.query.apiReviews.findFirst({
    where: and(eq(apiReviews.userId, userId), eq(apiReviews.apiId, apiId)),
  })
  return review || null
}
