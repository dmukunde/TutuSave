This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel
## Bank email import

TutuSave can turn bank transaction alert emails into **draft transactions** so you don't have to re-type every card purchase. Nothing is added to your budgets or reports until you review and approve it.

### How it works

1. **Your bank emails a transaction alert.** Currently supported: Standard Chartered Uganda card-purchase alerts.
2. **An n8n workflow picks it up.** It checks the import inbox every minute and extracts the amount, currency, merchant, date and last four card digits using deterministic rules (no AI).
3. **Duplicates are flagged.** Each alert gets a signature (card + amount + merchant + date). If a matching draft already exists, the new one is marked as a possible duplicate, and the database refuses to import the same email line twice.
4. **A draft lands in Review imports.** When drafts are waiting, a banner on the **Dashboard** links to **Review imports** (`/transactions/imports`). Check each draft, choose a category, then approve or reject it. Only approved drafts become real transactions.

### Setup

- **Supabase:** run migrations `0004_imported_transactions.sql` and `0005_bank_connections.sql`.
- **Environment:** set `IMPORT_EMAIL_BASE` in `.env.local` and in Vercel. It is the local part of the import Gmail address, without `@gmail.com` (see `.env.local.example`).
- **Your forwarding address:** **Settings → Email automation** shows your personal forwarding address. Routing forwarded emails to the right user is in progress (see #2); until then, imports are assigned to a single account.

### Design notes

- Drafts live in a separate `imported_transactions` table, so existing budget and report totals are never affected by unreviewed data.
- Logged-in users can read and review only their own drafts, and cannot create drafts directly. Only the automation's service key can insert them.
- Supported banks are defined as matching rules in the `bank_rules` table, so adding a bank means adding a rule, not changing app code.

See [`AUTOMATION_LEARNING.md`](./AUTOMATION_LEARNING.md) for the full n8n workflow build log.


The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
