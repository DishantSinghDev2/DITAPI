import { z } from "zod"

export const SignUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export const CreateOrgSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
})

export const PublishAPISchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  summary: z.string().min(10),
  description: z.string().optional(),
  categories: z.array(z.string()).min(1),
  docsMd: z.string().optional(),
})

export const CreatePlanSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["free", "subscription", "usage"]),
  priceCents: z.number().int().min(0),
  interval: z.enum(["monthly", "yearly"]).optional(),
  quota: z.object({
    reqPerPeriod: z.number().int().min(1),
    period: z.enum(["day", "month"]),
  }),
  rateLimit: z.object({
    permits: z.number().int().min(1),
    windowMs: z.number().int().min(1000),
  }),
  features: z.array(z.string()),
})
