const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

export const baseUrl =
  appUrl ||
  (vercelProductionUrl ? `https://${vercelProductionUrl}` : undefined) ||
  "http://localhost:3000";

export const FEED_PAGE_SIZE = 20;
export const COMMENT_PAGE_SIZE = 20;
