import { db } from "@/lib/database/connection"
import { pricingPlans } from "@/lib/database/schema"
import { eq } from "drizzle-orm"
import type { PricingPlan } from "@/types/api"

// This file is now deprecated as all queries are consolidated into production-queries.ts
// This file is kept for reference but should not be used.

export async function getPricingPlansByApiId(apiId: string): Promise<PricingPlan[]> {
  const plans = await db.query.pricingPlans.findMany({
    where: eq(pricingPlans.apiId, apiId),
    orderBy: pricingPlans.priceMonthly,
  })
  return plans
}

export async function getPricingPlanById(planId: string): Promise<PricingPlan | null> {
  const plan = await db.query.pricingPlans.findFirst({
    where: eq(pricingPlans.id, planId),
  })
  return plan || null
}

export async function createPricingPlan(
  planData: Omit<PricingPlan, "id" | "createdAt" | "updatedAt">,
): Promise<PricingPlan | null> {
  const [newPlan] = await db.insert(pricingPlans).values(planData).returning()
  return newPlan || null
}

export async function updatePricingPlan(
  planId: string,
  planData: Partial<Omit<PricingPlan, "id" | "createdAt" | "updatedAt">>,
): Promise<PricingPlan | null> {
  const [updatedPlan] = await db
    .update(pricingPlans)
    .set({
      ...planData,
      updatedAt: new Date(),
    })
    .where(eq(pricingPlans.id, planId))
    .returning()
  return updatedPlan || null
}

export async function deletePricingPlan(planId: string): Promise<boolean> {
  const result = await db.delete(pricingPlans).where(eq(pricingPlans.id, planId))
  return result.rowCount > 0
}
