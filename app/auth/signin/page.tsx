import { SigninForm } from "@/components/auth/signin-form"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default async function SigninPage({
  searchParams,
}: {
  searchParams: { message: string; redirect?: string }
}) {
  const { message, redirect } = await searchParams

  let alertMessage = null
  if (message === "signup_success") {
    alertMessage = {
      title: "Registration Successful!",
      description: "Your account has been created. Please sign in.",
      variant: "default",
    }
  } else if (message === "unauthenticated") {
    alertMessage = {
      title: "Authentication Required",
      description: "Please sign in to access that page.",
      variant: "destructive",
    }
  } else if (message === "unauthorized_admin_access") {
    alertMessage = {
      title: "Unauthorized Access",
      description: "You do not have administrative privileges to access that page.",
      variant: "destructive",
    }
  } else if (message === "unauthorized_access") {
    alertMessage = {
      title: "Unauthorized Access",
      description: "You do not have permission to access that page.",
      variant: "destructive",
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        {alertMessage && (
          <Alert variant={alertMessage.variant as any}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alertMessage.title}</AlertTitle>
            <AlertDescription>{alertMessage.description}</AlertDescription>
          </Alert>
        )}
        <SigninForm redirectPath={redirect} />
      </div>
    </div>
  )
}
