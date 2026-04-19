import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-black/[0.06] bg-white/80 py-6 text-center text-xs text-gray-400 font-mono">
        funded.gr — Greek Startup Showcase
      </footer>
    </div>
  );
}
