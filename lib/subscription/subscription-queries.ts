import { db } from "@/lib/database/connection"
import { apiSubscriptions } from "@/lib/database/schema"
import { eq, and, sql } from "drizzle-orm"
import type { ApiSubscription } from "@/types/api"

export async function getSubscriptionById(subscriptionId: string): Promise<ApiSubscription | null> {
  const subscription = await db.query.apiSubscriptions.findFirst({
    where: eq(apiSubscriptions.id, subscriptionId),
    with: {
      api: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
      pricingPlan: {
        columns: {
          id: true,
          name: true,
          priceMonthly: true,
        },
      },
    },
  })
  return subscription || null
}

export async function createSubscriptionInDb(
  userId: string,
  apiId: string,
  planId: string,
  stripeSubscriptionId?: string,
): Promise<ApiSubscription | null> {
  const [newSubscription] = await db
    .insert(apiSubscriptions)
    .values({
      userId,
      apiId,
      planId,
      stripeSubscriptionId,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
    })
    .returning()
  return newSubscription || null
}

export async function updateSubscriptionStatusInDb(
  subscriptionId: string,
  status: ApiSubscription["status"],
): Promise<ApiSubscription | null> {
  const [updatedSubscription] = await db
    .update(apiSubscriptions)
    .set({
      status: status,
      updatedAt: new Date(),
    })
    .where(eq(apiSubscriptions.id, subscriptionId))
    .returning()
  return updatedSubscription || null
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<ApiSubscription | null> {
  const subscription = await db.query.apiSubscriptions.findFirst({
    where: eq(apiSubscriptions.stripeSubscriptionId, stripeSubscriptionId),
  })
  return subscription || null
}

export async function getActiveSubscriptionForUserAndApi(
  userId: string,
  apiId: string,
): Promise<ApiSubscription | null> {
  const subscription = await db.query.apiSubscriptions.findFirst({
    where: and(
      eq(apiSubscriptions.userId, userId),
      eq(apiSubscriptions.apiId, apiId),
      eq(apiSubscriptions.status, "active"),
      sql`${apiSubscriptions.currentPeriodEnd} > NOW()`,
    ),
  })
  return subscription || null
}
