import { createHash } from "@better-auth/utils/hash";
import { createRandomStringGenerator } from "@better-auth/utils/random";
import type { Agent } from "@/db/queries/agents";
import { getAgentByApiKeyHash } from "@/db/queries/agents";

const API_KEY_PREFIX = "molt_";
const API_KEY_RAW_LENGTH = 32;
// Alphabets must be from the library's Alphabet type: "a-z" | "A-Z" | "0-9" | "-_" (hyphen only via "-_")
const generateRawKey = createRandomStringGenerator("A-Z", "a-z", "0-9", "-_");

export async function hashApiKey(apiKey: string): Promise<string> {
  return createHash("SHA-256", "hex").digest(apiKey) as Promise<string>;
}

export async function verifyApiKey(
  plainKey: string,
  hashedKey: string,
): Promise<boolean> {
  const hash = await hashApiKey(plainKey);
  return hash === hashedKey;
}

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${generateRawKey(API_KEY_RAW_LENGTH)}`;
}

export async function getAgentFromRequest(
  request: Request,
): Promise<Agent | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const hash = await hashApiKey(token);
  return getAgentByApiKeyHash(hash);
}
