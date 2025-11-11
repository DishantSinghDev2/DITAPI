import { MongoClient, type Db } from "mongodb"

let cached: { conn: MongoClient | null; db: Db | null } = { conn: null, db: null }

export async function connectToDatabase() {
  if (cached.conn) {
    return cached
  }

  const client = new MongoClient(process.env.MONGODB_URI!)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || "api-marketplace")

  cached = { conn: client, db }
  return cached
}

export async function getDatabase() {
  const { db } = await connectToDatabase()
  return db
}

export const getDB = getDatabase
