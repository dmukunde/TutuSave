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
