// Each budget gets its own accent colour so they're easy to tell apart at a
// glance. Deliberately avoids the green/amber/red family: those are reserved
// for budget *health* (healthy budgets show their own accent; near-limit
// and over-budget override it with amber/red so warnings stay obvious).
const CATEGORY_BUDGET_PALETTE = [
  "oklch(0.58 0.14 300)", // violet
  "oklch(0.6 0.1 190)", // teal
  "oklch(0.62 0.15 350)", // pink
  "oklch(0.6 0.12 240)", // sky blue
  "oklch(0.55 0.12 275)", // periwinkle
];

// The overall budget always uses the brand colour.
const OVERALL_BUDGET_COLOR = "oklch(0.52 0.19 268)";

// Assigns colours by creation order (oldest first), so a budget keeps its
// colour as new ones are added and the dashboard and Budgets page agree.
// Pass budgets in the same order both pages fetch them (newest first).
export function assignBudgetColors(
  budgetsNewestFirst: { id: string; category_id: string | null }[],
): Map<string, string> {
  const colors = new Map<string, string>();
  const oldestFirst = [...budgetsNewestFirst].reverse();

  let paletteIndex = 0;
  for (const budget of oldestFirst) {
    if (budget.category_id === null) {
      colors.set(budget.id, OVERALL_BUDGET_COLOR);
    } else {
      colors.set(budget.id, CATEGORY_BUDGET_PALETTE[paletteIndex % CATEGORY_BUDGET_PALETTE.length]);
      paletteIndex += 1;
    }
  }

  return colors;
}
