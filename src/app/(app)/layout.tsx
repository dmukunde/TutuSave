import Link from "next/link";
import { requireUser, getProfile } from "@/lib/supabase/dal";
import { getBuildInfo } from "@/lib/build-info";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profile = await getProfile();
  const build = getBuildInfo();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav email={user.email} />

      {!profile?.currency && (
        <div className="bg-warning-soft px-6 py-2 text-center text-sm text-warning">
          Choose your default currency in{" "}
          <Link href="/settings" className="font-medium underline">
            Settings
          </Link>{" "}
          to see amounts formatted correctly.
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6">{children}</main>

      <footer className="border-t px-6 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground sm:pb-3">
        Build {build.commit} · {build.env}
      </footer>
    </div>
  );
}
