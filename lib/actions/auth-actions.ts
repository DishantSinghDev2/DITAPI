"use server"

import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { pool } from "@/lib/database/connection"
import { createSession, deleteSession } from "@/app/session"

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  try {
    const { rows: existing } = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    )

    if (existing.length > 0) {
      return { error: "User already exists" }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const { rows } = await pool.query(
      `INSERT INTO users (name, username, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'admin', NOW(), NOW())
       RETURNING id, name, username, email, role`,
      [name, name, email, hashedPassword]
    )

    const user = rows[0]

    await createSession({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    return { success: true, user }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "Failed to create account" }
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, email, password_hash, role FROM users WHERE email = $1`,
      [email]
    )

    if (rows.length === 0) {
      return { error: "Invalid credentials" }
    }

    const user = rows[0]

    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return { error: "Invalid credentials" }
    }

    await createSession({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error: "Failed to sign in" }
  }
}

export async function signOut() {
  deleteSession()
  redirect("/")
}

// Aliases
export const loginUser = signIn
export const registerUser = signUp
export const signOutUser = signOut
