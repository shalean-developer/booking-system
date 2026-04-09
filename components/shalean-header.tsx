"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Menu,
  X,
  User,
  LayoutDashboard,
  CalendarDays,
  Settings,
  LogOut,
  FileText,
  CalendarCheck,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { ShaleanWordmark } from "@/components/shalean-wordmark";
import { supabase } from "@/lib/supabase-client";
import { safeLogout } from "@/lib/logout-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const brandBlue = "#2B59FF";
const brandTeal = "#26B99A";

/** Top navigation aligned with marketing home design */
const primaryNavLinks = [
  { label: "Residential", href: "/services/regular-cleaning" },
  { label: "Commercial", href: "/services/office-cleaning" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "About us", href: "/about" },
] as const;

const moreNavLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/blog" },
  { label: "Portal", href: "/dashboard" },
] as const;

export function ShaleanHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncUser = async () => {
      const {
        data: {session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthReady(true);
    };
    syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Account";

  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const profilePhoto =
    user?.user_metadata?.avatar_url || user?.user_metadata?.photo_url || null;

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    setMobileMenuOpen(false);
    await safeLogout(supabase, router, { redirectPath: "/" });
    setIsLoggingOut(false);
  };

  const isActive = (href: string) => {
    if (href === "/#how-it-works") return pathname === "/";
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href) ?? false;
  };

  const navItemClass = (href: string) =>
    cn(
      "rounded-lg px-2.5 xl:px-3 py-2 text-sm font-normal transition-colors whitespace-nowrap text-white/95",
      isActive(href)
        ? "font-semibold text-white bg-white/15"
        : "hover:bg-white/10 hover:text-white"
    );

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-[box-shadow] duration-200",
          isScrolled ? "shadow-md shadow-slate-900/20" : "shadow-sm shadow-slate-900/10"
        )}
        style={{ backgroundColor: brandBlue }}
      >
        <nav
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-4"
          aria-label="Main"
        >
          <div className="flex items-center gap-6 lg:gap-10 min-w-0">
            <Link
              href="/"
              className="shrink-0 cursor-pointer text-lg md:text-xl font-bold tracking-tight text-white hover:text-white/90"
              aria-label="Shalean Home"
            >
              <ShaleanWordmark dotClassName="text-emerald-400" />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5 min-w-0">
              {primaryNavLinks.map((link) => (
                <Link key={link.href} href={link.href} className={navItemClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              className="hidden md:inline-flex items-center justify-center gap-1.5 px-2.5 h-9 rounded-lg text-white transition-colors hover:bg-white/10"
              aria-label="Language: English"
            >
              <Globe className="w-5 h-5 shrink-0 text-white" strokeWidth={2} aria-hidden />
              <span className="text-sm font-medium tracking-wide">EN</span>
            </button>
            <Link
              href="/help"
              className="hidden sm:inline text-sm font-medium text-white transition-colors hover:text-white/85 px-2 py-1 rounded-lg hover:bg-white/10"
            >
              Help
            </Link>
            {!authReady ? (
              <div
                className="hidden sm:block h-9 w-9 rounded-full bg-white/10 border border-white/20 animate-pulse"
                aria-hidden
              />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hidden sm:inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-white border border-white/30 bg-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label={`Account menu for ${displayName}`}
                  >
                    <Avatar className="h-8 w-8 border border-white/40">
                      {profilePhoto ? (
                        <AvatarImage src={profilePhoto} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                        {initials || <User className="h-4 w-4" aria-hidden />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[8rem] truncate text-sm font-medium">
                      {displayName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-slate-900">
                        {displayName}
                      </span>
                      {user.email ? (
                        <span className="text-xs text-slate-500 truncate">
                          {user.email}
                        </span>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/bookings" className="cursor-pointer">
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      My bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/booking/service/standard/plan"
                      className="cursor-pointer"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Book a clean
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/booking/quote" className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      Get a quote
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Signing out…" : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white border border-white/40 bg-white/10 transition-colors hover:bg-white/20"
              >
                Login
              </Link>
            )}
            <Link
              href="/booking/quote"
              className="hidden sm:inline-flex items-center justify-center rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:opacity-95 active:scale-[0.98] md:px-5 md:text-sm"
              style={{ backgroundColor: brandTeal }}
            >
              Get a quote
            </Link>
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 text-white shadow-sm transition-colors hover:bg-white/20"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[60] flex flex-col p-6 text-white shadow-2xl"
            style={{ backgroundColor: brandBlue }}
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/20 pb-6">
              <ShaleanWordmark className="text-xl font-bold tracking-tight" dotClassName="text-emerald-400" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto">
              {[...primaryNavLinks, ...moreNavLinks].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-xl py-3 text-lg font-medium transition-colors",
                    isActive(link.href)
                      ? "text-white font-semibold bg-white/15"
                      : "text-white/90 hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl py-3 text-left text-lg font-medium text-white/90 transition-colors hover:bg-white/10"
                aria-label="Language: English"
              >
                <Globe className="h-5 w-5 shrink-0 text-white" strokeWidth={2} aria-hidden />
                <span className="text-sm font-semibold tracking-wide">EN</span>
              </button>
              <Link
                href="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl py-3 text-lg font-medium text-white/90 transition-colors hover:bg-white/10"
              >
                Help
              </Link>
              {user ? (
                <>
                  <div className="pt-2 mt-1 border-t border-white/15 text-xs font-semibold uppercase tracking-wide text-white/60 px-1">
                    Your account
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl py-3 text-lg font-medium text-white/90 transition-colors hover:bg-white/10"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl py-3 text-lg font-medium text-white/90 transition-colors hover:bg-white/10"
                  >
                    My bookings
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl py-3 text-lg font-medium text-white/90 transition-colors hover:bg-white/10"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/booking/service/standard/plan"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl py-3 text-lg font-medium text-white/90 transition-colors hover:bg-white/10"
                  >
                    Book a clean
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="rounded-xl py-3 text-left text-lg font-medium text-red-200 transition-colors hover:bg-white/10 disabled:opacity-60"
                  >
                    {isLoggingOut ? "Signing out…" : "Log out"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl py-3 text-lg font-medium text-white/90 transition-colors hover:bg-white/10"
                >
                  Login
                </Link>
              )}
              <Link
                href="/booking/quote"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 inline-flex justify-center rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:opacity-95"
                style={{ backgroundColor: brandTeal }}
              >
                Get a quote
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
