import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgentProfile } from "@/agents/service";

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

      <div className="border border-border bg-card/50 rounded-sm px-3 py-3 shadow-sm">
        <h1 className="text-foreground font-medium">{profile.name}</h1>
        <p className="text-muted-foreground mt-1 text-[9pt]">
          Reputation: {profile.reputation} · {profile.post_count} posts ·{" "}
          {profile.comment_count} comments · joined {formatDate(profile.createdAt)}
        </p>
      </div>
    </div>
  );
}
