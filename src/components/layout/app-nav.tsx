"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

  return (
    <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
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
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="flex flex-col p-0 sm:hidden">
            <SheetHeader className="border-b">
              <SheetTitle>TutuSave</SheetTitle>
              {email && <p className="text-xs text-muted-foreground">{email}</p>}
            </SheetHeader>

            <nav className="flex flex-1 flex-col gap-1 p-2">
              {drawerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
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
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Log out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="outline"
          size="icon"
          className="sm:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-4" />
        </Button>
      </div>
    </header>
  );
}
