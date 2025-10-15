import { z } from "zod";

export const SignalSchema = z.object({
  title: z.string(),
  country: z.string(),
  mineral: z.string(),
  narrative: z.string(),
  embedding: z.array(z.number()),
  publishedAt: z.date(),
});
export type Signal = z.infer<typeof SignalSchema>;

