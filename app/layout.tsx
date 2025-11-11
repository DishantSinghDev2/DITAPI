import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SessionProvider } from "next-auth/react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DITAPI - Advanced API Marketplace",
  description:
    "DITAPI: The advanced API marketplace by DishIs Technologies. Discover, test, and integrate powerful APIs with instant search, AI-powered setup, and comprehensive analytics.",
  generator: "v0.app",
  keywords: "API marketplace, API discovery, API integration, REST API, GraphQL, webhooks",
  authors: [{ name: "DishIs Technologies" }],
  creator: "DishIs Technologies",
  publisher: "DishIs Technologies",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "DITAPI - Advanced API Marketplace",
    description: "The advanced API marketplace by DishIs Technologies",
    type: "website",
    url: "https://api.dishis.tech",
    siteName: "DITAPI",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
