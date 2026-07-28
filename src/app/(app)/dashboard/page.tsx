import { requireUser } from "@/lib/supabase/dal";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as {user.email}. Budgets, spending, and goals will show up
        here starting in Phase 2.
      </p>
    </div>
  );
}
