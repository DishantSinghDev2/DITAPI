import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

export interface User {
  id: string
  email: string
  name: string
  role: string
}

const SECRET = process.env.JWT_SECRET || "local-dev-secret"
const KEY = new TextEncoder().encode(SECRET)

async function encrypt<T extends Record<string, unknown>>(payload: T) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("2h").sign(KEY)
}

async function decrypt<T = unknown>(token?: string): Promise<T | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify<T>(token, KEY, { algorithms: ["HS256"] })
    return payload
  } catch (err) {
    console.error("Failed to decrypt session:", err)
    return null
  }
}

export async function createSession(user: User) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2) // 2 hours
  const token = await encrypt({ user, exp: Math.floor(expiresAt.getTime() / 1000) })

  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })
}

export function deleteSession() {
  cookies().delete("session")
}

export async function updateSession() {
  const current = cookies().get("session")?.value
  const data = await decrypt<{ user: User }>(current)

  if (!data) return
  await createSession(data.user)
}

export async function getSession(): Promise<User | null> {
  const token = cookies().get("session")?.value
  const data = await decrypt<{ user: User }>(token)
  return data?.user ?? null
}
