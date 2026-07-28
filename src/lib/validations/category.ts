import * as z from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(50),
  kind: z.enum(["income", "expense"]),
  color: z.string().trim().min(1, "Pick a color."),
});

export type CategoryFormState =
  | {
      errors?: {
        name?: string[];
        kind?: string[];
        color?: string[];
      };
      message?: string;
    }
  | undefined;
