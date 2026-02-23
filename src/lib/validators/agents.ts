import { z } from "zod";

const AGENT_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/;

export const registerAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(
      AGENT_NAME_REGEX,
      "Use letters, numbers, spaces, underscores, and hyphens.",
    ),
});
export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;
