import * as z from "zod";

export const budgetSchema = z
  .object({
    categoryId: z
      .string()
      .transform((value) => (value === "" ? undefined : value))
      .optional(),
    amount: z.coerce.number().positive("Amount must be greater than zero."),
    periodType: z.enum(["monthly", "yearly", "custom"]),
    startDate: z.string().min(1, "Pick a start date."),
    endDate: z
      .string()
      .nullable()
      .transform((value) => (value === "" || value == null ? undefined : value))
      .optional(),
    alertThresholdPct: z.coerce
      .number()
      .int()
      .min(1, "Must be between 1 and 100.")
      .max(100, "Must be between 1 and 100."),
  })
  .refine((data) => data.periodType !== "custom" || !!data.endDate, {
    message: "Custom budgets need an end date.",
    path: ["endDate"],
  });

export type BudgetFormState =
  | {
      errors?: {
        categoryId?: string[];
        amount?: string[];
        periodType?: string[];
        startDate?: string[];
        endDate?: string[];
        alertThresholdPct?: string[];
      };
      message?: string;
    }
  | undefined;
