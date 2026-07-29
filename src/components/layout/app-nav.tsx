"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { logout } from "@/lib/actions/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

const drawerLinks = [...links, { href: "/profile", label: "Profile" }];

export function AppNav({ email }: { email: string | undefined }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="relative flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-6">
        <span className="font-semibold tracking-tight">TutuSave</span>
        <nav className="hidden gap-4 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={
                pathname === link.href
                  ? "text-sm font-medium text-foreground"
                  : "text-sm text-muted-foreground hover:text-foreground"
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

        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-input sm:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
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
              <div>
                <p className="font-semibold tracking-tight">TutuSave</p>
                {email && <p className="text-xs text-muted-foreground">{email}</p>}
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
                    "rounded-md px-3 py-2 text-sm " +
                    (pathname === link.href
                      ? "bg-muted font-medium text-foreground"
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
  );
}
