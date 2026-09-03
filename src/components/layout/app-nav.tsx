"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, ArrowLeftRight, Wallet, Target, Menu, X } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { LogoMark } from "@/components/brand/logo-mark";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

const drawerLinks = [...links, { href: "/profile", label: "Profile" }];

// Primary destinations for the persistent mobile bottom tab bar. "More"
// (below) opens the same drawer as the rest of the links, so it isn't
// duplicated here.
const bottomNavLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
];

export function AppNav({ email }: { email: string | undefined }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3 shadow-xs sm:px-6 sm:py-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2">
          <LogoMark className="size-7" />
          <span className="font-heading text-lg font-semibold tracking-tight">
            TutuSave
          </span>
        </span>
        <nav className="hidden gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={
                "rounded-lg px-2.5 py-1.5 text-sm transition-colors " +
                (pathname === link.href
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
        <form action={logout} className="hidden sm:block">
          <button
            type="submit"
            className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted"
          >
            Log out
          </button>
        </form>
      </div>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={closeMenu}
            className="fixed inset-0 z-50 bg-black/40"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-y-0 left-0 z-50 flex w-3/4 max-w-xs flex-col bg-background shadow-lg"
          >
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <LogoMark className="size-7" />
                <div>
                  <p className="font-heading font-semibold tracking-tight">TutuSave</p>
                  {email && <p className="text-xs text-muted-foreground">{email}</p>}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMenu}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-input"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-2">
              {drawerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={
                    "rounded-lg px-3 py-2.5 text-sm " +
                    (pathname === link.href
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground")
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t p-2">
              <form action={logout}>
                <button
                  type="submit"
                  onClick={closeMenu}
                  className="w-full rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card shadow-[0_-1px_8px_-2px_rgb(0_0_0_/_0.08)] sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {bottomNavLinks.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors " +
                (active ? "font-medium text-primary" : "text-muted-foreground")
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="More"
          onClick={() => setOpen(true)}
          className={
            "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors " +
            (open ? "font-medium text-primary" : "text-muted-foreground")
          }
        >
          <Menu className="size-5" aria-hidden="true" />
          More
        </button>
      </nav>
    </>
  );
}
