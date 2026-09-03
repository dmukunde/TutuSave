import { getProfile } from "@/lib/supabase/dal";
import { ensureEmailConnection } from "@/lib/actions/email-connections";
import { createClient } from "@/lib/supabase/server";
import { CurrencyForm } from "@/components/forms/currency-form";
import { EmailAutomationCard } from "@/components/settings/email-automation-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const profile = await getProfile();
  const connection = await ensureEmailConnection();

  const supabase = await createClient();
  const { data: bankRules } = await supabase
    .from("bank_rules")
    .select("bank_name, default_currency")
    .eq("is_active", true)
    .order("bank_name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
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
            <p className="text-sm text-warning">
              You haven&apos;t chosen a currency yet — amounts show as plain
              numbers until you do.
            </p>
          )}
          <CurrencyForm currentCurrency={profile?.currency ?? null} />
        </CardContent>
      </Card>

      <EmailAutomationCard
        connection={connection}
        bankRules={bankRules ?? []}
        importEmailBase={process.env.IMPORT_EMAIL_BASE ?? null}
      />
    </div>
  );
}
