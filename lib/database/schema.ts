import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  jsonb,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  username: varchar("username", { length: 255 }).unique().notNull(),
  fullName: varchar("full_name", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // 'developer', 'provider', 'admin'
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const usersRelations = relations(users, ({ many }) => ({
  apis: many(apis),
  subscriptions: many(subscriptions),
  applications: many(applications),
  userApiKeys: many(userApiKeys),
  reviews: many(reviews),
  apiUsage: many(apiUsage),
  apiRequests: many(apiRequests),
}))

// Providers Table
export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  supportEmail: varchar("support_email", { length: 255 }),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const providersRelations = relations(providers, ({ many }) => ({
  apis: many(apis),
}))

// Categories Table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
})

export const categoriesRelations = relations(categories, ({ many }) => ({
  apiCategories: many(apiCategories),
}))

// APIs Table
export const apis = pgTable("apis", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: varchar("logo_url", { length: 255 }),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 255 }).notNull(), // Deprecated, use apiCategories instead
  requestCount: integer("request_count").default(0), // Total requests made to this API
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  longDescription: text("long_description"),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  baseUrl: varchar("base_url", { length: 255 }).notNull(),
  documentationUrl: varchar("documentation_url", { length: 255 }),
  supportUrl: varchar("support_url", { length: 255 }),
  termsUrl: varchar("terms_url", { length: 255 }),
  privacyUrl: varchar("privacy_url", { length: 255 }),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0.0"), // Average rating out of 5.0
  totalSubscribers: integer("total_subscribers").default(0),
  averageLatency: integer("average_latency").default(0), // in milliseconds
  uptimePercentage: numeric("uptime_percentage", { precision: 5, scale: 2 }).default("100.00"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'active', 'inactive', 'deprecated'
  isPublic: boolean("is_public").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const apisRelations = relations(apis, ({ one, many }) => ({
  provider: one(providers, {
    fields: [apis.providerId],
    references: [providers.id],
  }),
  apiCategories: many(apiCategories),
  pricingPlans: many(pricingPlans),
  subscriptions: many(subscriptions),
  userApiKeys: many(userApiKeys),
  reviews: many(reviews),
  apiUsage: many(apiUsage),
  apiRequests: many(apiRequests),
}))

// API Categories Junction Table
export const apiCategories = pgTable(
  "api_categories",
  {
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey(t.apiId, t.categoryId),
  }),
)

export const apiCategoriesRelations = relations(apiCategories, ({ one }) => ({
  api: one(apis, {
    fields: [apiCategories.apiId],
    references: [apis.id],
  }),
  category: one(categories, {
    fields: [apiCategories.categoryId],
    references: [categories.id],
  }),
}))

// Pricing Plans Table
export const pricingPlans = pgTable(
  "pricing_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }).notNull().default("0.00"),
    priceYearly: numeric("price_yearly", { precision: 10, scale: 2 }).notNull().default("0.00"),
    requestsPerMonth: integer("requests_per_month").notNull().default(0),
    rateLimitPerSecond: integer("rate_limit_per_second").notNull().default(0),
    isFree: boolean("is_free").notNull().default(false),
    isPopular: boolean("is_popular").notNull().default(false),
    features: jsonb("features"), // e.g., ['feature1', 'feature2']
    stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }), // Stripe Price ID for monthly billing
    stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }), // Stripe Price ID for yearly billing
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    unq: unique("api_id_name_unique").on(t.apiId, t.name),
  }),
)

export const pricingPlansRelations = relations(pricingPlans, ({ one, many }) => ({
  api: one(apis, {
    fields: [pricingPlans.apiId],
    references: [apis.id],
  }),
  subscriptions: many(subscriptions),
}))

// Subscriptions Table
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }),
    pricingPlanId: uuid("pricing_plan_id")
      .notNull()
      .references(() => pricingPlans.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'cancelled', 'past_due', 'trialing'
    startDate: timestamp("start_date", { withTimezone: true }).defaultNow(),
    endDate: timestamp("end_date", { withTimezone: true }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(), // Stripe Subscription ID
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }), // Stripe Customer ID
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    unq: unique("user_api_unique").on(t.userId, t.apiId), // A user can only have one active subscription per API
  }),
)

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  api: one(apis, {
    fields: [subscriptions.apiId],
    references: [apis.id],
  }),
  pricingPlan: one(pricingPlans, {
    fields: [subscriptions.pricingPlanId],
    references: [pricingPlans.id],
  }),
}))

// Applications Table (for developers to manage their projects)
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  redirectUris: text("redirect_uris").array(), // Array of redirect URIs for OAuth flows
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  userApiKeys: many(userApiKeys),
}))

// User API Keys Table (for applications to access APIs)
export const userApiKeys = pgTable(
  "user_api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyPrefix: varchar("key_prefix", { length: 8 }).notNull(), // e.g., "dk_12345678"
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }), // Which API this key is for
    keyValue: varchar("key_value", { length: 255 }).unique().notNull(), // The actual API key string
    keyHash: varchar("key_hash", { length: 64 }).notNull(), // Hashed version of the key for security
    name: varchar("name", { length: 255 }), // A user-friendly name for the key
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // The user who generated this key
  },
  (t) => ({
    unq: unique("application_api_unique").on(t.applicationId, t.apiId), // An application can only have one key per API
  }),
)

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  application: one(applications, {
    fields: [userApiKeys.applicationId],
    references: [applications.id],
  }),
  api: one(apis, {
    fields: [userApiKeys.apiId],
    references: [apis.id],
  }),
  createdBy: one(users, {
    fields: [userApiKeys.createdByUserId],
    references: [users.id],
  }),
}))

// API Usage Metrics Table (for real-time and aggregated usage)
export const apiUsage = pgTable(
  "api_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requests: integer("requests").notNull().default(0),
    dataTransferred: numeric("data_transferred", { precision: 15, scale: 2 }).notNull().default("0.00"), // in bytes
    errors: integer("errors").notNull().default(0),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(), // Granularity can be hourly/daily
    hourBucket: varchar("hour_bucket", { length: 20 }), // Format: YYYY-MM-DD-HH for hourly aggregation
  },
  (t) => ({
    // Use a simple unique constraint on api_id, user_id, and hour_bucket
    unq: unique("api_user_hourly_usage_unique").on(t.apiId, t.userId, t.hourBucket!),
    // Add indexes for better query performance
    apiIdIdx: index("api_usage_api_id_idx").on(t.apiId),
    userIdIdx: index("api_usage_user_id_idx").on(t.userId),
    timestampIdx: index("api_usage_timestamp_idx").on(t.timestamp),
  }),
)

export const apiUsageRelations = relations(apiUsage, ({ one }) => ({
  api: one(apis, {
    fields: [apiUsage.apiId],
    references: [apis.id],
  }),
  user: one(users, {
    fields: [apiUsage.userId],
    references: [users.id],
  }),
}))

// API Request Logs Table (for detailed request/response logging)
export const apiRequests = pgTable(
  "api_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    method: varchar("method", { length: 10 }).notNull(),
    path: text("path").notNull(),
    statusCode: integer("status_code").notNull(),
    latency: integer("latency"), // in milliseconds
    requestSize: integer("request_size"), // in bytes
    responseSize: integer("response_size"), // in bytes
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    // Add indexes for better query performance
    apiIdIdx: index("api_requests_api_id_idx").on(t.apiId),
    userIdIdx: index("api_requests_user_id_idx").on(t.userId),
    timestampIdx: index("api_requests_timestamp_idx").on(t.timestamp),
  }),
)

export const apiRequestsRelations = relations(apiRequests, ({ one }) => ({
  api: one(apis, {
    fields: [apiRequests.apiId],
    references: [apis.id],
  }),
  user: one(users, {
    fields: [apiRequests.userId],
    references: [users.id],
  }),
}))

// Reviews Table
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    unq: unique("api_user_review_unique").on(t.apiId, t.userId), // A user can only review an API once
  }),
)

export const reviewsRelations = relations(reviews, ({ one }) => ({
  api: one(apis, {
    fields: [reviews.apiId],
    references: [apis.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}))
