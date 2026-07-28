import { requireUser } from "@/lib/supabase/dal";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav email={user.email} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
