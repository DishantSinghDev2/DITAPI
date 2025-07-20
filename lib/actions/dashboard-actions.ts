"use server"

import type { UserApplication, ApiSubscription } from "@/types/api"
import { pool } from "@/lib/database/connection"

export async function getUserApplications(userId: string) {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, 
             json_agg(
               json_build_object(
                 'id', uak.id,
                 'name', uak.name,
                 'keyPrefix', uak.key_prefix,
                 'keyHash', SUBSTRING(uak.key_hash, 1, 4) || '...',
                 'isActive', uak.is_active,
                 'lastUsedAt', uak.last_used_at,
                 'createdAt', uak.created_at
               )
             ) FILTER (WHERE uak.id IS NOT NULL) as api_keys
      FROM applications a
      LEFT JOIN user_api_keys uak ON a.id = uak.application_id
      WHERE a.user_id = $1
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `, [userId])

    return {
      success: true,
      applications: rows.map(app => ({
        ...app,
        apiKeys: app.api_keys || [],
      })) as UserApplication[],
    }
  } catch (error) {
    console.error("Get user applications error:", error)
    return { success: false, message: "Failed to load applications" }
  }
}

export async function createApplication(userId: string, application: Partial<UserApplication>) {
  try {
    const { rows } = await pool.query(`
      INSERT INTO applications (user_id, name, description, website, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [userId, application.name, application.description ?? null, application.website ?? null])

    return { success: true, application: rows[0] as UserApplication }
  } catch (error) {
    console.error("Create application error:", error)
    return { success: false, message: "Failed to create application" }
  }
}

export async function updateApplication(applicationId: string, application: Partial<UserApplication>) {
  try {
    const { rows } = await pool.query(`
      UPDATE applications 
      SET name = $1, 
          description = $2, 
          website = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [
      application.name,
      application.description ?? null,
      application.website ?? null,
      applicationId,
    ])

    return { success: true, application: rows[0] as UserApplication }
  } catch (error) {
    console.error("Update application error:", error)
    return { success: false, message: "Failed to update application" }
  }
}

export async function deleteApplication(applicationId: string) {
  try {
    await pool.query(`DELETE FROM user_api_keys WHERE application_id = $1`, [applicationId])
    await pool.query(`DELETE FROM applications WHERE id = $1`, [applicationId])

    return { success: true, message: "Application deleted successfully" }
  } catch (error) {
    console.error("Delete application error:", error)
    return { success: false, message: "Failed to delete application" }
  }
}

export async function getUserSubscriptions(userId: string) {
  try {
    const { rows } = await pool.query(`
      SELECT s.*,
             json_build_object(
               'id', a.id,
               'name', a.name,
               'slug', a.slug,
               'description', a.description,
               'logoUrl', a.logo_url
             ) as api,
             json_build_object(
               'id', pp.id,
               'name', pp.name,
               'price', pp.price,
               'billingPeriod', pp.billing_period,
               'requestLimit', pp.request_limit
             ) as pricing_plan,
             json_agg(
               json_build_object(
                 'id', uak.id,
                 'name', uak.name,
                 'keyPrefix', uak.key_prefix,
                 'isActive', uak.is_active
               )
             ) FILTER (WHERE uak.id IS NOT NULL) as api_keys
      FROM subscriptions s
      JOIN apis a ON s.api_id = a.id
      JOIN pricing_plans pp ON s.pricing_plan_id = pp.id
      LEFT JOIN user_api_keys uak ON uak.user_id = s.user_id
      WHERE s.user_id = $1
      GROUP BY s.id, a.id, pp.id
      ORDER BY s.created_at DESC
    `, [userId])

    return {
      success: true,
      subscriptions: rows.map(sub => ({
        ...sub,
        apiKeys: sub.api_keys || [],
      })) as ApiSubscription[],
    }
  } catch (error) {
    console.error("Get user subscriptions error:", error)
    return { success: false, message: "Failed to load subscriptions" }
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    await pool.query(`
      UPDATE subscriptions 
      SET cancel_at_period_end = true, updated_at = NOW()
      WHERE id = $1
    `, [subscriptionId])

    return { success: true, message: "Subscription marked for cancellation" }
  } catch (error) {
    console.error("Cancel subscription error:", error)
    return { success: false, message: "Failed to cancel subscription" }
  }
}
