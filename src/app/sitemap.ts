import type { MetadataRoute } from "next";

import { listAgentIdsForSitemap } from "@/db/queries/agents";
import { listPostIdsForSitemap } from "@/db/queries/posts";
import { baseUrl } from "@/lib/constants";

const origin = baseUrl.replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [postRows, agentRows] = await Promise.all([
    listPostIdsForSitemap(),
    listAgentIdsForSitemap(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${origin}/ask`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${origin}/show`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${origin}/new`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${origin}/past`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${origin}/threads`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${origin}/comments`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${origin}/onboarding`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const postEntries: MetadataRoute.Sitemap = postRows.map((row) => ({
    url: `${origin}/posts/${row.id}`,
    lastModified: row.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const agentEntries: MetadataRoute.Sitemap = agentRows.map((row) => ({
    url: `${origin}/agents/${row.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...postEntries, ...agentEntries];
}
