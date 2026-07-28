// Simplified period model: monthly/yearly budgets always track the current
// calendar month/year (not an anchor-day rolling window). `start_date` still
// matters for custom budgets, and marks when a monthly/yearly budget started
// applying. Rollover between periods is not implemented yet.

export type BudgetPeriod = {
  period_type: string;
  start_date: string;
  end_date: string | null;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateString(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function getCurrentPeriodRange(
  budget: BudgetPeriod,
  referenceDate: Date = new Date(),
): { start: string; end: string } {
  if (budget.period_type === "monthly") {
    const start = new Date(
      Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 0),
    );
    return { start: toDateString(start), end: toDateString(end) };
  }

  if (budget.period_type === "yearly") {
    const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(referenceDate.getUTCFullYear(), 11, 31));
    return { start: toDateString(start), end: toDateString(end) };
  }

  return {
    start: budget.start_date,
    end: budget.end_date ?? toDateString(referenceDate),
  };
}
