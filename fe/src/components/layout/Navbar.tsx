import Link from "next/link";
import { Code2, PlusCircle, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  return (
    <header className="border-b border-black/[0.06] bg-gradient-to-b from-white/95 via-white/90 to-transparent backdrop-blur-xl sticky top-0 z-10">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3" onClick={close}>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-xl tracking-tight text-gray-800 leading-none">
                funded.gr
              </p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Ελληνική κοινότητα καινοτομίας
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/?action=new"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Project
                </Link>
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white/80 backdrop-blur-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <Link
                    href="/profile"
                    className="text-sm font-mono text-gray-700 hover:text-gray-900"
                  >
                    {user?.name ?? user?.email?.split("@")[0]}
                  </Link>
                  <button
                    onClick={signOut}
                    className="ml-2 text-xs text-gray-500 hover:text-gray-700 font-medium transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition shadow-sm text-sm font-medium"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Hamburger button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-black/5 transition"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden mt-3 pb-3 flex flex-col gap-1 border-t border-black/[0.06] pt-3">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={close}
                    className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-black/5 font-medium transition"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/?action=new"
                  onClick={close}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50 font-medium transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Project
                </Link>
                <Link
                  href="/profile"
                  onClick={close}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-black/5 font-mono transition"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  {user?.name ?? user?.email?.split("@")[0]}
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    close();
                  }}
                  className="text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-black/5 font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  onClick={close}
                  className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-black/5 font-medium transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={close}
                  className="px-3 py-2 rounded-lg text-sm bg-gray-800 text-white hover:bg-gray-700 font-medium transition text-center"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
