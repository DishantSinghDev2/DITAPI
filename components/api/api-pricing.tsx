"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import type { API, PricingPlan, Subscription } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { loadStripe } from "@stripe/stripe-js"
import { toast } from "@/hooks/use-toast"

interface ApiPricingProps {
  api: API
  pricingPlans: PricingPlan[]
  userSubscription?: Subscription
}

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function ApiPricing({ api, pricingPlans, userSubscription }: ApiPricingProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!plan.stripePriceIdMonthly && !plan.stripePriceIdYearly) {
      toast({
        title: "Subscription Error",
        description: "This plan is not configured for payments.",
        variant: "destructive",
      })
      return
    }

    const priceId = billingCycle === "monthly" ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly

    if (!priceId) {
      toast({
        title: "Subscription Error",
        description: `This plan does not have a ${billingCycle} billing option.`,
        variant: "destructive",
      })
      return
    }

    try {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Stripe.js failed to load.")
      }

      // Create a Checkout Session on your backend
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: priceId,
          apiId: api.id,
          pricingPlanId: plan.id,
          billingCycle: billingCycle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create Stripe Checkout session.")
      }

      const session = await response.json()

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
    } catch (error: any) {
      toast({
        title: "Subscription Error",
        description: error.message || "An unexpected error occurred during subscription.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Plans for {api.name}</CardTitle>
        <CardDescription>Choose the plan that best fits your needs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex justify-center mb-6">
          <RadioGroup
            defaultValue="monthly"
            onValueChange={(value: "monthly" | "yearly") => setBillingCycle(value)}
            className="flex p-1 bg-gray-100 rounded-md"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly">Monthly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yearly" id="yearly" />
              <Label htmlFor="yearly">Yearly (Save 10%)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col border-2 ${
                userSubscription?.pricingPlanId === plan.id ? "border-blue-500 shadow-lg" : "border-gray-200"
              } ${plan.is_popular ? "relative" : ""}`}
            >
              {plan.is_popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white">Most Popular</Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                <div className="text-4xl font-bold mt-4">
                  ${billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly}
                  <span className="text-lg text-muted-foreground">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
                {plan.is_free && <p className="text-sm text-muted-foreground">Free forever</p>}
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>{plan.requests_per_month.toLocaleString()} Requests/Month</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>{plan.rate_limit_per_second} Req/Second Rate Limit</span>
                  </li>
                  {plan.features &&
                    Array.isArray(plan.features) &&
                    plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                {userSubscription?.pricingPlanId === plan.id ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleSubscribe(plan)}>
                    {plan.is_free ? "Get Started" : "Subscribe"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
