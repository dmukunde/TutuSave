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
        <div className="bg-amber-100 px-6 py-2 text-center text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          Choose your default currency in{" "}
          <Link href="/settings" className="font-medium underline">
            Settings
          </Link>{" "}
          to see amounts formatted correctly.
        </div>
      )}

      <main className="flex-1 p-6">{children}</main>

      <footer className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
        Build {build.commit} · {build.env}
      </footer>
    </div>
  );
}
