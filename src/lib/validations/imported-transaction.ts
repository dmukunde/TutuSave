import * as z from "zod";

export const approveImportedTransactionSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  kind: z.enum(["income", "expense"]),
  description: z.string().trim().max(200),
  occurredAt: z.string().min(1, "Pick a date."),
  categoryId: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
});

export type ApproveImportedTransactionState =
  | {
      errors?: {
        amount?: string[];
        description?: string[];
        occurredAt?: string[];
      };
      message?: string;
    }
  | undefined;
