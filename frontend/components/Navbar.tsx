"use client"

import Link from "next/link"
import { useState } from "react"

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center shadow-sm group-hover:scale-95 transition-transform">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.3" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">ClientAI</span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Product", href: "#" },
              { label: "Features", href: "#" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Docs", href: "#" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/signin"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/signin"
              className="px-3.5 py-1.5 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-all shadow-sm font-medium"
            >
              Get started →
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="flex flex-col gap-1.5 w-5">
              <span className={`h-0.5 bg-gray-700 rounded transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`h-0.5 bg-gray-700 rounded transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 bg-gray-700 rounded transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {["Product", "Features", "Dashboard", "Docs"].map((item) => (
            <Link
              key={item}
              href="#"
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 flex flex-col gap-1">
            <Link href="/signin" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition">
              Sign in
            </Link>
            <Link href="/chat" className="px-3 py-2 text-sm bg-black text-white rounded-md text-center">
              Get started →
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}