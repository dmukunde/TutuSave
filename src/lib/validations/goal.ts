import * as z from "zod";

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  targetAmount: z.coerce.number().positive("Target must be greater than zero."),
  targetDate: z
    .string()
    .nullable()
    .transform((value) => (value === "" || value == null ? undefined : value))
    .optional(),
});

export type GoalFormState =
  | {
      errors?: {
        name?: string[];
        targetAmount?: string[];
        targetDate?: string[];
      };
      message?: string;
    }
  | undefined;

export const contributionSchema = z.object({
  goalId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  note: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .transform((value) => (value === "" || value == null ? undefined : value))
    .optional(),
});

export type ContributionFormState =
  | {
      errors?: {
        amount?: string[];
        note?: string[];
      };
      message?: string;
    }
  | undefined;
