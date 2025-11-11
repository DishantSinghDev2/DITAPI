import paypal from "paypal-rest-sdk"

paypal.configure({
  mode: process.env.PAYPAL_MODE || "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
})

export const paypalService = {
  async createBillingPlan(name: string, amount: string, interval: "MONTH" | "YEAR") {
    return new Promise((resolve, reject) => {
      paypal.billingPlan.create(
        {
          name,
          type: "INFINITE",
          payment_definitions: [
            {
              name: "Regular Payment Definition",
              type: "REGULAR",
              frequency: interval,
              frequency_interval: "1",
              amount: {
                value: amount,
                currency: "USD",
              },
              cycles: "0",
            },
          ],
          merchant_preferences: {
            return_url: `${process.env.NEXTAUTH_URL}/billing/return`,
            cancel_url: `${process.env.NEXTAUTH_URL}/billing/cancel`,
            notify_url: `${process.env.NEXTAUTH_URL}/api/billing/webhook`,
            max_fail_attempts: "0",
            initial_fail_amount_action: "CANCEL",
            day_of_month: "1",
          },
        },
        (err: any, billingPlan: any) => {
          if (err) reject(err)
          else resolve(billingPlan)
        },
      )
    })
  },

  async activateBillingPlan(planId: string) {
    return new Promise((resolve, reject) => {
      paypal.billingPlan.update(
        planId,
        [{ op: "replace", path: "/state", value: "ACTIVE" }],
        (err: any, response: any) => {
          if (err) reject(err)
          else resolve(response)
        },
      )
    })
  },

  async createBillingAgreement(planId: string, startDate: Date) {
    return new Promise((resolve, reject) => {
      paypal.billingAgreement.create(
        {
          name: "API Subscription Agreement",
          description: "Subscription to API Marketplace",
          start_date: new Date(startDate.getTime() + 2000).toISOString(),
          plan: {
            id: planId,
          },
          payer: {
            payment_method: "paypal",
          },
        },
        (err: any, billingAgreement: any) => {
          if (err) reject(err)
          else resolve(billingAgreement)
        },
      )
    })
  },

  async executeBillingAgreement(token: string) {
    return new Promise((resolve, reject) => {
      paypal.billingAgreement.execute(token, {}, (err: any, billingAgreement: any) => {
        if (err) reject(err)
        else resolve(billingAgreement)
      })
    })
  },
}
