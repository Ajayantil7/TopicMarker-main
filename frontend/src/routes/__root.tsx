import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner"
import { type QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { userQueryOptions } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});

function NavBar() {
  // Query to check if user is authenticated
  const { data, isError } = useQuery(userQueryOptions);
  const isAuthenticated = !isError && data?.user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation links component to avoid repetition
  const NavLinks = () => (
    <>
      <Link to="/about" className="[&.active]:font-bold text-base hover:text-primary transition-colors">
        About
      </Link>
      {/* MDX Public route is accessible to everyone */}
      <Link to="/mdxPublic" className="[&.active]:font-bold text-base hover:text-primary transition-colors">
        MDX Public
      </Link>

      {/* Protected routes only shown when authenticated */}
      {isAuthenticated && (
        <>
          <Link to="/mdx" className="[&.active]:font-bold text-base hover:text-primary transition-colors">
            MDX Editor
          </Link>
          <Link to="/profile" className="[&.active]:font-bold text-base hover:text-primary transition-colors">
            Profile
          </Link>
        </>
      )}
    </>
  );

  // Authentication buttons component
  const AuthButtons = () => (
    <>
      {isAuthenticated ? (
        <Button asChild size="sm" variant="outline" className="text-base">
          <a href="/api/logout">Logout</a>
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="text-base">
            <a href="/api/login">Login</a>
          </Button>
          <Button asChild size="sm" className="text-base">
            <a href="/api/register">Signup</a>
          </Button>
        </div>
      )}
    </>
  );

  return (
    <nav className="relative px-4 py-3 w-full">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        {/* Logo - always visible */}
        <Link to="/" className="text-xl md:text-2xl font-bold z-10 flex-shrink-0">
          Topic Marker
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-4 lg:gap-6">
          <NavLinks />
          <div className="ml-2">
            <AuthButtons />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-10 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-background z-50 md:hidden">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4">
                <Link
                  to="/"
                  className="text-2xl font-bold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Topic Marker
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-6 p-6 text-lg">
                <NavLinks />
                <div className="mt-4">
                  <AuthButtons />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function Root() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <hr className="w-full" />
      <main className="flex-1 px-4 py-6 w-full max-w-6xl mx-auto">
        <Outlet />
      </main>
      <Toaster />
      {/* <TanStackRouterDevtools /> */}
    </div>
  );
}
