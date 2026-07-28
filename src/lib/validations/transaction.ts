import * as z from "zod";

export const transactionSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero."),
  kind: z.enum(["income", "expense"]),
  categoryId: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  description: z.string().trim().max(200).optional(),
  occurredAt: z.string().min(1, "Pick a date."),
});

export type TransactionFormState =
  | {
      errors?: {
        amount?: string[];
        kind?: string[];
        categoryId?: string[];
        description?: string[];
        occurredAt?: string[];
      };
      message?: string;
    }
  | undefined;
