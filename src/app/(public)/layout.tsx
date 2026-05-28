"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, LayoutDashboard, Ticket, Package, BookOpen, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import HelpdeskWidget from '@/components/widget/HelpdeskWidget';
import { useAuthStore } from "@/lib/auth-store"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const logout = useAuthStore(s => s.logout)

  const isFuncionario = isAuthenticated && user?.role?.name === 'usuario'

  const publicNavLinks = [
    { href: "/portal/knowledge-base", label: "Base de Conocimiento" },
    { href: "/login", label: "Iniciar Sesión" },
  ]

  const portalNavLinks = [
    { href: "/portal/mis-tickets", label: "Mis Tickets", icon: Ticket },
    { href: "/portal/mis-activos", label: "Mis Activos", icon: Package },
    { href: "/portal/knowledge-base", label: "Base de Conocimiento", icon: BookOpen },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navLinks = isFuncionario ? portalNavLinks : publicNavLinks

  const widgetUser = isFuncionario && user
    ? {
        id: user.id,
        name: user.name,
        token: useAuthStore.getState().token!,
        email: user.email,
        area: typeof user.area === 'string' ? user.area : user.area?.name ?? '',
      }
    : null

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={isFuncionario ? "/portal/mis-tickets" : "/"} className="flex items-center gap-3">
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
            <div className="hidden md:flex items-center gap-6">
              {isFuncionario ? (
                <>
                  {portalNavLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname.startsWith(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                          isActive ? 'text-primary' : 'text-foreground/70 hover:text-primary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    )
                  })}
                  <div className="flex items-center gap-2 ml-2 pl-4 border-l border-border">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground/80 max-w-30 truncate">{user?.name}</span>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Cerrar sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                publicNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm"
                  >
                    {link.label}
                  </Link>
                ))
              )}
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
            <div className="md:hidden py-4 border-t border-border space-y-1">
              {isFuncionario ? (
                <>
                  {portalNavLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2 py-2.5 px-2 text-foreground/80 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    )
                  })}
                  <div className="pt-2 border-t border-border flex items-center justify-between px-2">
                    <span className="text-sm text-muted-foreground">{user?.name}</span>
                    <button onClick={handleLogout} className="text-sm text-destructive flex items-center gap-1">
                      <LogOut className="w-4 h-4" /> Salir
                    </button>
                  </div>
                </>
              ) : (
                publicNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block py-2 px-2 text-foreground/80 hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="min-h-screen">
        {children}
      </main>
      <HelpdeskWidget user={widgetUser} />
    </div>
  );
}
