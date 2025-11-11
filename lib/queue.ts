import Queue from "bull"

const redisConfig = {
  url: process.env.REDIS_URL,
}

export const billingQueue = new Queue("billing", redisConfig)
export const usageAggregationQueue = new Queue("usage-aggregation", redisConfig)
export const payoutQueue = new Queue("payouts", redisConfig)
export const apisixSyncQueue = new Queue("apisix-sync", redisConfig)
export const emailQueue = new Queue("emails", redisConfig)

// Set up queue error handlers
;[billingQueue, usageAggregationQueue, payoutQueue, apisixSyncQueue, emailQueue].forEach((queue) => {
  queue.on("error", (error) => {
    console.error(`Queue error: ${error.message}`)
  })

  queue.on("failed", (job, error) => {
    console.error(`Job ${job.id} failed: ${error.message}`)
  })
})

export type BillingJobData = {
  subscriptionId: string
  invoiceId: string
}

export type UsageAggregationJobData = {
  subscriptionId: string
  date: string
}

export type PayoutJobData = {
  organizationId: string
  amount: number
}

export type APISIXSyncJobData = {
  apiId: string
  action: "create" | "update" | "delete"
}

export type EmailJobData = {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}
