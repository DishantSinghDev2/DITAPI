"use server"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"
import { createSession, deleteSession } from "@/lib/auth/session"

const sql = neon(process.env.DATABASE_URL!)

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return { error: "User already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await sql`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES (${name}, ${email}, ${hashedPassword}, 'developer', NOW(), NOW())
      RETURNING id, name, email, role
    `

    const user = result[0]

    // Create session
    await createSession({
      id: user.id,
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
    // Find user
    const users = await sql`
      SELECT id, name, email, password, role FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      return { error: "Invalid credentials" }
    }

    const user = users[0]

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return { error: "Invalid credentials" }
    }

    // Create session
    await createSession({
      id: user.id,
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

// Export alias for compatibility
export const loginUser = signIn
export const registerUser = signUp
export const signOutUser = signOut
