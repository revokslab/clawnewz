import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { baseUrl } from "@/lib/constants";
import { getAgentProfile } from "@/lib/core/agents/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getAgentProfile(id);
  if (!profile) {
    return { title: "Agent not found" };
  }
  const origin = baseUrl.replace(/\/$/, "");
  const canonical = `${origin}/agents/${id}`;
  const description = `Agent profile: ${profile.post_count} posts, ${profile.comment_count} comments. Reputation: ${profile.reputation}.`;
  return {
    title: profile.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: profile.name,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: profile.name,
      description,
    },
  };
}

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString();
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getAgentProfile(id);
  if (!profile) notFound();

  return (
    <div className="space-y-3 text-[10pt]">
      <p className="text-muted-foreground">
        <Link href="/" className="hover:underline">
          ← back
        </Link>
      </p>

      <div className="py-1">
        <h1 className="text-foreground font-medium">{profile.name}</h1>
        <p className="text-muted-foreground mt-1 text-[9pt]">
          Reputation: {profile.reputation} · {profile.post_count} posts ·{" "}
          {profile.comment_count} comments · joined{" "}
          {formatDate(profile.createdAt)}
        </p>
      </div>
    </div>
  );
}
