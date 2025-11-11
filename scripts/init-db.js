const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const MONGODB_DB = process.env.MONGODB_DB || "api-marketplace"

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db(MONGODB_DB)

    console.log("Creating collections and indexes...")

    // Users
    await db.createCollection("users").catch(() => {})
    await db.collection("users").createIndex({ email: 1 }, { unique: true })

    // Organizations
    await db.createCollection("organizations").catch(() => {})
    await db.collection("organizations").createIndex({ slug: 1 }, { unique: true })
    await db.collection("organizations").createIndex({ ownerId: 1 })

    // APIs
    await db.createCollection("apis").catch(() => {})
    await db.collection("apis").createIndex({ organizationId: 1 })
    await db.collection("apis").createIndex({ slug: 1 })

    // Plans
    await db.createCollection("plans").catch(() => {})
    await db.collection("plans").createIndex({ apiId: 1 })

    // Subscriptions
    await db.createCollection("subscriptions").catch(() => {})
    await db.collection("subscriptions").createIndex({ userId: 1 })
    await db.collection("subscriptions").createIndex({ apiId: 1 })
    await db.collection("subscriptions").createIndex({ apiKey: 1 })

    // Invoices
    await db.createCollection("invoices").catch(() => {})
    await db.collection("invoices").createIndex({ subscriptionId: 1 })
    await db.collection("invoices").createIndex({ userId: 1 })
    await db.collection("invoices").createIndex({ invoiceNumber: 1 }, { unique: true })

    // Usage
    await db.createCollection("usage").catch(() => {})
    await db.collection("usage").createIndex({ subscriptionId: 1 })
    await db.collection("usage").createIndex({ date: 1 })

    // API Keys
    await db.createCollection("apiKeys").catch(() => {})
    await db.collection("apiKeys").createIndex({ userId: 1 })
    await db.collection("apiKeys").createIndex({ keyHash: 1 }, { unique: true })

    console.log("Database initialized successfully!")
  } catch (error) {
    console.error("Error initializing database:", error)
  } finally {
    await client.close()
  }
}

initializeDatabase()
