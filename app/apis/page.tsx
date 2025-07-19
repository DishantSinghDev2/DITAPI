import { ApiMarketplace } from "@/components/api-marketplace"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse APIs - DITAPI",
  description: "Explore thousands of APIs across various categories on DITAPI.",
}

export default function ApisPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <ApiMarketplace />
    </div>
  )
}
