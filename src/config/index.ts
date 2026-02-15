function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  get databaseUrl() {
    return getEnv("DATABASE_URL");
  },
} as const;
