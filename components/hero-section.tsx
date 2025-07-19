import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Search } from "lucide-react"

export function HeroSection() {
  return (
    <section className="hero-gradient relative overflow-hidden">
      {/* Abstract background shapes */}
      <div className="shape-1"></div>
      <div className="shape-2"></div>
      <div className="shape-3"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            An API Marketplace So Dazzling, <span className="block">Developers Won't Want to Leave</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
            Where businesses, partners, and their APIs build the products that chart the future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              asChild
            >
              <Link href="/apis">
                <Search className="mr-2 h-5 w-5" />
                Explore APIs
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold bg-transparent"
              asChild
            >
              <Link href="/providers/studio">
                Become a Provider
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
