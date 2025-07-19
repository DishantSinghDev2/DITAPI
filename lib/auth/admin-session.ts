import { getSession } from "./session"
import { db } from "@/lib/database/connection"
import { users } from "@/lib/database/schema"
import { eq } from "drizzle-orm"
import type { UserSession } from "@/types/api"

// This file is now deprecated as session management is consolidated into session.ts
// This file is kept for reference but should not be used.

export async function getAdminSession(): Promise<{ user: UserSession } | null> {
  const session = await getSession()

  if (!session?.user?.id) {
    return null
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      role: true,
      isVerified: true,
    },
  })

  if (user && (user.role === "admin" || user.role === "provider")) {
    return { user: user as UserSession }
  }

  return null
}
