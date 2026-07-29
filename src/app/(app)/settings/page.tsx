import { getProfile } from "@/lib/supabase/dal";
import { CurrencyForm } from "@/components/forms/currency-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage how TutuSave displays your money.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!profile?.currency && (
            <p className="text-sm text-amber-600">
              You haven&apos;t chosen a currency yet — amounts show as plain
              numbers until you do.
            </p>
          )}
          <CurrencyForm currentCurrency={profile?.currency ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
