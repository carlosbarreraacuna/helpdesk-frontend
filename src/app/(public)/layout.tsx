"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Ticket, Package, BookOpen, LogOut, ShieldCheck, ChevronDown } from "lucide-react"
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
  const [isOpen,       setIsOpen]       = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
                  {/* User dropdown */}
                  <div ref={userMenuRef} className="relative ml-2 pl-4 border-l border-border">
                    <button
                      onClick={() => setUserMenuOpen(v => !v)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground/80 max-w-[120px] truncate">{user?.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                        <Link
                          href="/portal/seguridad"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-gray-400" />
                          Seguridad
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    )}
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
                  <div className="pt-2 border-t border-border space-y-1 px-2">
                    <span className="block text-xs text-muted-foreground px-1 pb-1">{user?.name}</span>
                    <Link
                      href="/portal/seguridad"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 py-2 px-1 text-sm text-gray-700 hover:text-primary transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" /> Seguridad
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 py-2 px-1 text-sm text-destructive w-full">
                      <LogOut className="w-4 h-4" /> Cerrar sesión
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
