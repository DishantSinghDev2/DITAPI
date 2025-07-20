"use server"

import { randomBytes } from "crypto"
import { pool } from "@/lib/database/connection"
import type { UserApiKey } from "@/types/database"

export async function generateApiKey(userId: string, applicationId: string, name: string) {
  try {
    const keyValue = `dk_${randomBytes(32).toString("hex")}`
    const keyPrefix = keyValue.substring(0, 8)
    const keyHash = keyValue.substring(8)

    const { rows } = await pool.query(`
      INSERT INTO user_api_keys (user_id, application_id, name, key_prefix, key_hash, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, user_id, application_id, name, key_prefix, is_active, created_at, updated_at
    `, [userId, applicationId, name, keyPrefix, keyHash])

    if (rows.length === 0) {
      return { success: false, message: "Failed to generate API key" }
    }

    const apiKey = rows[0] as UserApiKey

    return {
      success: true,
      apiKey: {
        ...apiKey,
        keyPrefix,
        keyHash: keyHash.substring(0, 4) + "...",
      },
      fullKey: keyValue,
    }
  } catch (error) {
    console.error("Generate API key error:", error)
    return { success: false, message: "Failed to generate API key" }
  }
}

export async function deleteApiKey(apiKeyId: string) {
  try {
    await pool.query(`DELETE FROM user_api_keys WHERE id = $1`, [apiKeyId])
    return { success: true, message: "API key deleted successfully" }
  } catch (error) {
    console.error("Delete API key error:", error)
    return { success: false, message: "Failed to delete API key" }
  }
}

export async function validateApiKey(keyValue: string): Promise<UserApiKey | null> {
  try {
    if (!keyValue.startsWith("dk_")) return null

    const keyPrefix = keyValue.substring(0, 8)
    const keyHash = keyValue.substring(8)

    const { rows } = await pool.query(`
      SELECT uak.*, a.name as application_name, u.email as user_email
      FROM user_api_keys uak
      JOIN applications a ON uak.application_id = a.id
      JOIN users u ON uak.user_id = u.id
      WHERE uak.key_prefix = $1 
        AND uak.key_hash = $2
        AND uak.is_active = true
    `, [keyPrefix, keyHash])

    if (rows.length === 0) return null

    // Update last used timestamp
    await pool.query(`UPDATE user_api_keys SET last_used_at = NOW() WHERE id = $1`, [rows[0].id])

    return rows[0] as UserApiKey
  } catch (error) {
    console.error("Validate API key error:", error)
    return null
  }
}

export async function getUserApiKeys(applicationId: string): Promise<UserApiKey[]> {
  try {
    const { rows } = await pool.query(`
      SELECT id, user_id, application_id, name, key_prefix, is_active, last_used_at, created_at, updated_at
      FROM user_api_keys 
      WHERE application_id = $1
      ORDER BY created_at DESC
    `, [applicationId])

    return rows as UserApiKey[]
  } catch (error) {
    console.error("Get user API keys error:", error)
    return []
  }
}

export async function toggleApiKeyStatus(apiKeyId: string, isActive: boolean) {
  try {
    await pool.query(`
      UPDATE user_api_keys 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
    `, [isActive, apiKeyId])

    return { success: true, message: `API key ${isActive ? "activated" : "deactivated"} successfully` }
  } catch (error) {
    console.error("Toggle API key status error:", error)
    return { success: false, message: "Failed to update API key status" }
  }
}
