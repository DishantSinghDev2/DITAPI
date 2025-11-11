import { auth } from "./auth"
import { getDatabase } from "./db"
import { ObjectId } from "mongodb"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireRole(role: "provider" | "consumer" | "admin") {
  const session = await requireAuth()
  const db = await getDatabase()

  const user = await db.collection("users").findOne({
    email: session.user?.email,
  })

  if (!user || user.role !== role) {
    throw new Error("Forbidden")
  }

  return { session, user }
}

export async function getUserById(userId: string) {
  const db = await getDatabase()
  return await db.collection("users").findOne({
    _id: new ObjectId(userId),
  })
}

export async function getUserByEmail(email: string) {
  const db = await getDatabase()
  return await db.collection("users").findOne({ email })
}
