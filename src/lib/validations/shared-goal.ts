import * as z from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]];

export const createSharedGoalSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  targetAmount: z.coerce.number().positive("Target must be greater than zero."),
  currency: z.enum(currencyCodes, { error: "Choose a currency." }),
  targetDate: z
    .string()
    .nullable()
    .transform((value) => (value === "" || value == null ? undefined : value))
    .optional(),
  splitType: z.enum(["equal", "percentage", "fixed"]),
  ownerSplitValue: z
    .string()
    .nullable()
    .transform((value) => (value === "" || value == null ? undefined : value))
    .optional()
    .transform((value) => (value === undefined ? undefined : Number(value))),
});

export type CreateSharedGoalFormState =
  | {
      errors?: {
        name?: string[];
        targetAmount?: string[];
        currency?: string[];
        splitType?: string[];
      };
      message?: string;
    }
  | undefined;

export const inviteMemberSchema = z.object({
  sharedGoalId: z.string().min(1),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email, or leave blank for a link-only invite.")
    .nullable()
    .transform((value) => (value === "" || value == null ? undefined : value))
    .optional(),
  splitValue: z
    .string()
    .nullable()
    .transform((value) => (value === "" || value == null ? undefined : Number(value)))
    .optional(),
});

export type InviteMemberFormState =
  | {
      errors?: { email?: string[]; splitValue?: string[] };
      message?: string;
      inviteLink?: string;
    }
  | undefined;

export const sharedContributionSchema = z.object({
  sharedGoalId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  contributedAt: z.string().min(1, "Pick a date."),
  note: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .transform((value) => (value === "" || value == null ? undefined : value))
    .optional(),
});

export type SharedContributionFormState =
  | {
      errors?: { amount?: string[]; contributedAt?: string[] };
      message?: string;
    }
  | undefined;

export const updateSplitSchema = z.object({
  memberId: z.string().min(1),
  splitValue: z.coerce.number().nonnegative("Must be zero or greater."),
});
