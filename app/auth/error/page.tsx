"use client"

import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    AccessDenied: "Access was denied.",
    Callback: "There was an error with the callback.",
    OAuthSignin: "Error connecting with OAuth provider.",
    OAuthCallback: "Error in OAuth callback.",
    OAuthCreateAccount: "Could not create user account.",
    EmailCreateAccount: "Could not create user account.",
    Callback: "There was an error with the callback.",
    OAuthAccountNotLinked: "This email is already used with a different sign-in method.",
    EmailSignInError: "Check your email address.",
    CredentialsSignin: "Sign in failed. Check your credentials.",
    SessionCallback: "Session callback error.",
    Default: "An unexpected error occurred. Please try again.",
  }

  const message = errorMessages[error as keyof typeof errorMessages] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3">
          <Link href="/auth/signin" className="flex-1">
            <Button className="w-full">Try Again</Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
