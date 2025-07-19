import Image from "next/image"

export function TrustedBy() {
  const partners = [
    { name: "Google", logo: "/placeholder.svg?height=40&width=120" },
    { name: "Microsoft", logo: "/placeholder.svg?height=40&width=120" },
    { name: "Amazon", logo: "/placeholder.svg?height=40&width=120" },
    { name: "Stripe", logo: "/placeholder.svg?height=40&width=120" },
    { name: "Netflix", logo: "/placeholder.svg?height=40&width=120" },
  ]

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-600 mb-8">Trusted by leading companies worldwide</h2>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {partners.map((partner) => (
            <div key={partner.name} className="flex-shrink-0">
              <Image
                src={partner.logo || "/placeholder.svg"}
                alt={`${partner.name} Logo`}
                width={120}
                height={40}
                className="h-10 object-contain grayscale opacity-75 hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
