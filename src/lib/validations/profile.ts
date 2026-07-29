import * as z from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]];

export const currencySchema = z.object({
  currency: z.enum(currencyCodes, { error: "Choose a currency." }),
});

export type ProfileFormState =
  | {
      errors?: {
        currency?: string[];
      };
      message?: string;
    }
  | undefined;

export const fullNameSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(100),
});

export type FullNameFormState =
  | {
      errors?: {
        fullName?: string[];
      };
      message?: string;
    }
  | undefined;
