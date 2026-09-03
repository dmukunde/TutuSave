import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForwardingAddress } from "@/components/settings/forwarding-address";
import type { Database } from "@/types/database";

type EmailConnection = Database["public"]["Tables"]["email_connections"]["Row"];
type BankRule = Pick<
  Database["public"]["Tables"]["bank_rules"]["Row"],
  "bank_name" | "default_currency"
>;

export function EmailAutomationCard({
  connection,
  bankRules,
  importEmailBase,
}: {
  connection: EmailConnection | null;
  bankRules: BankRule[];
  importEmailBase: string | null;
}) {
  const address =
    connection && importEmailBase
      ? `${importEmailBase}+${connection.forward_token}@gmail.com`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email automation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">Forward bank alerts</h3>
            {connection?.status === "connected" && (
              <span className="rounded-full bg-income/15 px-2 py-0.5 text-[0.7rem] font-medium tracking-wide text-income uppercase">
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Forward bank transaction alert emails to the address below (or
            set up a Gmail filter to auto-forward them). TutuSave detects
            known banks and stages the transaction for your review.
          </p>
          {address ? (
            <ForwardingAddress address={address} />
          ) : (
            <p className="text-sm text-warning">
              Email automation isn&apos;t configured on this deployment yet.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Gmail — direct connect
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your Gmail account directly, no forwarding required. Not
            available yet.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Your banks</h3>
          {bankRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No banks configured yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {bankRules.map((rule) => (
                <li key={rule.bank_name}>
                  {rule.bank_name}
                  {rule.default_currency ? ` (${rule.default_currency})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
