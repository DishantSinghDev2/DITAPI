import Link from "next/link"
import { Facebook, Twitter, Linkedin, Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-xl font-bold text-white">DITAPI</span>
            </Link>
            <p className="text-sm">Your premier API marketplace for building the future.</p>
            <div className="flex space-x-4 mt-4">
              <Link href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Linkedin className="h-6 w-6" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Github className="h-6 w-6" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/apis" className="hover:text-white text-sm">
                  Explore APIs
                </Link>
              </li>
              <li>
                <Link href="/providers/studio" className="hover:text-white text-sm">
                  Become a Provider
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white text-sm">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-white text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white text-sm">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white text-sm">
                  API Glossary
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white text-sm">
                  Community Forum
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <p className="text-sm">123 API Lane, Suite 400</p>
            <p className="text-sm">Tech City, CA 90210</p>
            <p className="text-sm mt-2">
              Email:{" "}
              <a href="mailto:info@ditapi.com" className="hover:text-white">
                info@ditapi.com
              </a>
            </p>
            <p className="text-sm">Phone: (123) 456-7890</p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} DITAPI. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <Link href="#" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
