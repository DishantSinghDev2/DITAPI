import { HeroSection } from "@/components/hero-section"
import { StatsSection } from "@/components/stats-section"
import { TrustedBy } from "@/components/trusted-by"
import { FeaturedApis } from "@/components/featured-apis"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <StatsSection />
        </div>
      </section>
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured APIs</h2>
          <FeaturedApis />
        </div>
      </section>
      <TrustedBy />
    </div>
  )
}
