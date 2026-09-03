# Automation Learning Log

This file documents each n8n automation built for TutuSave: the business problem it solves, how it works, what broke during development, and what was learned. Per the learning approach for this project, workflows are built interactively and deliberately, not generated wholesale — this log captures that process, not just the finished result.

**Never record actual secret values here** (API keys, OAuth secrets, service-role keys). Reference that a credential exists and what it's for, nothing more.

---

## Workflow: TutuSave — Bank Email Import (v1, deterministic)

**Status:** Published/Active in n8n.cloud ("Personal" space) as of this session.

### Business problem

Bank transaction alerts (Standard Chartered Uganda, sender `alerts.uganda@sc.com`) arrive by email whenever a card purchase is made. Previously these had to be manually re-entered into TutuSave. This workflow automatically detects those emails, extracts the transaction details, checks whether it's already been recorded, and stages it as a **pending draft** transaction for the user to review and approve inside TutuSave — it never silently creates a real, confirmed transaction on its own.

### Trigger

**Gmail Trigger** node, polling every minute, filtered to `alerts.uganda@sc.com`. Uses Google OAuth credential (broad scope selected deliberately, for learning purposes). `Simplify` is turned **off** — this matters: with Simplify off, this n8n version's Gmail Trigger output is *not* the raw Gmail API shape (no `payload.parts[]`); instead it's a flattened item with a top-level `html` field already decoded, plus `headers`, `subject`, `date`, `to`, `from`, `messageId`.

### Systems involved

- **Gmail** (source of truth for the raw alert)
- **n8n.cloud** (orchestration — trigger, extraction, decision logic)
- **Supabase Postgres** (`imported_transactions` staging table — see migration `0004_imported_transactions.sql`)
- **TutuSave app** (Review Imports page — where the human approves or rejects each draft)

### Data flow / node chain

```
Gmail Trigger (poll every 1 min, sender filter)
  -> Code in JavaScript (regex extraction)
  -> Supabase "Get many rows" (dedup check by dedup_signature)
  -> If (did Get Many find an existing row?)
       -> true:  Prepare Insert Data (possible duplicate)  --\
       -> false: Prepare Insert Data (MVP - hardcoded user) --+--> Supabase "Create a row" (insert into imported_transactions)
```

**1. Code node — extraction (deterministic, no AI):**
Regex against the email's `html` field:
```
/UGX\s([\d,]+\.\d{2})\stransaction was made on card ending (\d{4}) at (.+?) on (\d{4}-\d{2}-\d{2})/g
```
Loops all regex matches per email (the bank's template sometimes duplicates the same sentence within one email — deduped within the loop via a `Set` of seen lines) and outputs one item per real transaction line: `amount`, `currency`, `card_last4`, `merchant`, `occurred_at`, `source_message_id` (the Gmail message ID), `raw_snippet` (the matched line, kept for audit), and a computed `dedup_signature` (`card_last4|amount|MERCHANT|date`, normalized uppercase, commas stripped).

**2. Supabase "Get many rows" — duplicate check:**
Filters `imported_transactions` where `dedup_signature` equals the current item's signature. Deliberately checks signature only (not `source_message_id`) — this is what allows genuinely re-sent or re-described emails of the *same* transaction to be caught, distinct from the database's own `unique(source_message_id, dedup_signature)` constraint which only prevents the *same* email being processed twice.

**3. If node — decision:**
Condition: `{{ Object.keys($json).length }}` is not equal to `0`, Number type. True = a matching row was found (duplicate). False = no match (clean insert). See "Errors and fixes" below for why this ended up as an object-key-count check instead of a direct field check.

**4a. Prepare Insert Data (MVP – hardcoded user)** (False/clean branch):
Edit Fields node. Builds all columns `imported_transactions` needs. Pulls the real extracted values from the Code node via `$('Code in JavaScript').first().json.xxx` (this node's own `$json` is the *Get Many* node's empty `{}` output, not the transaction data — a cross-node reference is required). `possible_duplicate_of` is **omitted entirely** (not set to `""`) so it lands as `NULL` in Postgres.

**4b. Prepare Insert Data (possible duplicate)** (True branch):
Same as above, plus `possible_duplicate_of` set to `{{ $json.id }}` — on this branch, `$json` *is* the matched row directly, so no cross-node reference needed for that one field.

**5. Supabase "Create a row":**
Inserts into `imported_transactions` using "Auto-Map Input Data to Columns" (field names already match column names exactly). `status` defaults to `'pending'` at the database level. **Retry on Fail** enabled (3 tries, 1000ms apart, On Error: Stop Workflow) — the one reliability control added before activation.

### Credentials / integrations

- **Gmail OAuth2** credential (n8n-managed, connected via Google's consent flow).
- **Supabase** credential using the **service-role key** (bypasses RLS — required because this workflow writes to `imported_transactions`, which has no `INSERT` policy for the `authenticated` role on purpose; only the service role can write). Entered directly into n8n's own credential form, never shared outside n8n.

### Deliberate MVP shortcuts (explicitly temporary — see field-level comments would be ideal here, but n8n JSON fields can't carry comments, hence noting it here)

- `user_id` is **hardcoded** to a single fixed Supabase auth user UUID inside the "Prepare Insert Data" nodes. Lives only in n8n's node configuration — never in the TutuSave repo or frontend code, and not a bypass-RLS-grade secret on its own.
- `kind` is hardcoded to `'expense'` — v1 only handles card-purchase debit alerts, not income.
- `description` is generated simply as `{merchant} (card •••{last4})` — not a cleaner/smarter parser.

**Planned replacements (not yet built):** dynamic user resolution (multi-user support), transaction-type detection (income vs. expense), and better description generation.

### Key n8n expressions/concepts learned this session

- Cross-node reference syntax: `$('Node Name').first().json.field` — needed whenever a node's own `$json` isn't the data you actually want (e.g. reading the Code node's output from three nodes downstream).
- `$json` always means *this node's own input item*, not "the original trigger data" or "whatever I extracted earlier" — an easy trap.
- `Object.keys($json).length` as a robust way to test "is this JSON object empty?" — more reliable than checking one field's existence/emptiness directly, because a missing field can resolve to the literal string `"undefined"` in expression previews rather than a true falsy value, which breaks naive `exists`/`is not empty` checks.
- **Pin Data**: locks a node's output to fixed test data so downstream nodes can be tested repeatedly and deterministically without needing new live trigger events. Caveat learned the hard way: a pin reliably overrides *directly wired* downstream nodes, but a node several hops away that references the pinned node **by name** (`$('Node')...`) doesn't always respect the pin when tested in isolation via that node's own "Execute step" — only a full **"Execute workflow"** run (single coherent pass) guarantees consistency across the whole chain.
- **"Always Output Data"** (a per-node Settings toggle): without it, a node producing zero items **halts the entire workflow** rather than just passing nothing forward. Needed on "Get many rows" (so "no duplicate found," the normal case, doesn't kill the workflow) — but deliberately left **off** on the If node, where it was found to inject a phantom empty item into whichever branch got zero real items, corrupting the true/false routing during testing.
- **Retry on Fail** (per-node Settings): automatic retries on a failing node before the execution is marked failed — configured on the final insert node ahead of activation.

### Errors and fixes (chronological)

1. **Code node: "No output data returned."** Root cause: stale/pinned test data on the Gmail Trigger predating a Simplify toggle change. Fixed by re-fetching live test data.
2. **Code node: `Cannot read properties of undefined (reading 'mimeType')`.** Wrong assumption that this n8n version's Simplify-off output matched the raw Gmail API's `payload.parts[]` shape. Actual shape has a flat top-level `html` field. Diagnosed via a quick `Object.keys(item.json)` probe, then rewrote the extraction to use `item.json.html` directly — simpler than the original code.
3. **Get Many filter field:** dragging the `dedup_signature` pill into an already-populated Field Value box appended the expression after leftover literal text instead of replacing it — had to clear the field fully before dragging again.
4. **If node, "exists" operator:** on an empty `{}` object, `{{ $json.id }}` didn't behave as a true `undefined` for the `exists`/`is not empty` string operators — routed to the wrong branch. Fixed by switching to a `Number` condition on `Object.keys($json).length`.
5. **"Always Output Data" on the If node** silently created a phantom item in whichever branch got zero real items, making both branches appear to have 1 item during testing. Traced by checking the node's own Settings tab; turned off (unlike on Get Many, where it's needed).
6. **True-branch Edit Fields node not connected** to the shared "Create a row" insert node — visually looked wired on a zoomed-out canvas but wasn't; n8n's own "no connection back to the node" error on execution caught it. Fixed by explicitly dragging a new connection.
7. **`possible_duplicate_of` as `""` instead of `NULL`** — Postgres rejected an empty string against a `uuid` column. Fixed by omitting the field entirely on the clean-insert branch rather than setting it to an empty value.
8. **`amount` inserted as a quoted string** instead of a number — fixed by explicitly setting the Edit Fields node's field type to `Number`.
9. **Duplicate-key constraint violation during True-branch testing** (`unique(source_message_id, dedup_signature)`) — initially looked like a bug, but was actually the database's own safety net correctly refusing to let the *same test email* insert the *same signature* twice. Real proof of the constraint working. Resolved for testing purposes by changing the pinned `source_message_id` to a distinct fake value, correctly simulating "a different email reporting the same transaction."
10. **Accidentally swapped a JSON key and value** while editing pinned test data (field ended up named `"test-different-email-999"` instead of keeping the name `source_message_id` and changing its value) — caught via a `null value in column "source_message_id" violates not-null constraint` error.

### Reliability controls in place

- Database-level `unique(source_message_id, dedup_signature)` constraint as a last-resort duplicate guard, independent of the n8n-side dedup check.
- "Always Output Data" enabled specifically where zero-result is the expected common case (Get Many), so the workflow doesn't halt on the normal path.
- Retry on Fail (3 tries) on the final insert node.
- n8n's own Executions log serves as the basic audit trail for now — no custom logging/alerting built yet.

### Security considerations

- Google OAuth scope was deliberately set broad ("select all") for learning purposes — worth narrowing to just Gmail read access in a future pass, since least-privilege wasn't actually applied here yet.
- Supabase service-role key (bypasses RLS) is required because `imported_transactions` intentionally has no `INSERT` policy for normal users — only entered directly into n8n's credential UI, never exposed to chat, the repo, or frontend code.
- `user_id` hardcoded in n8n config is not treated as a secret (grants no access by itself) but still deliberately kept out of the Git repo.
- No secrets of any kind are recorded in this file.

### What was learned

This was the first fully hands-on n8n workflow build: trigger configuration and OAuth scopes, the items/JSON data model, writing and debugging expressions (including several genuine n8n quirks — empty-object truthiness, pin-data propagation limits, "Always Output Data" side effects), deterministic regex-based extraction as an alternative to AI extraction, designing a composite dedup key across multiple real-world signals, and a first pass at reliability (retries) before flipping a workflow to unattended/live.

### Deferred / next steps

- Second, AI-based extraction version, to compare against this deterministic v1.
- Dynamic user resolution to replace the hardcoded `user_id`.
- Transaction-type detection to replace the hardcoded `kind = 'expense'`.
- Narrower OAuth scope.
- A real error-notification path (currently relies on manually checking the Executions log).
