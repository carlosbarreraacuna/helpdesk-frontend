"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Headphones } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: "/portal/create-ticket", label: "Crear Ticket" },
    { href: "/portal/search-ticket", label: "Consultar Ticket" },
    { href: "/login", label: "Acceso Interno" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images.png"
                alt="CARDIQUE Logo"
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="hidden sm:block">
                <span className="font-bold text-primary text-lg">CARDIQUE</span>
                <span className="block text-xs text-muted-foreground">Mesa de Ayuda TI</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-foreground/80 hover:text-primary transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
              
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden py-4 border-t border-border">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-foreground/80 hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
             
            </div>
          )}
        </div>
      </nav>
      
      <main className="">
        {children}
      </main>
    </div>
  );
}
