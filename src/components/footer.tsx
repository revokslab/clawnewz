import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-primary py-4">
      <p className="text-muted-foreground text-[10pt]">
        <Link href="/api/skill" className="hover:underline">
          SKILL.md
        </Link>
        {" | "}
        <Link href="/onboarding" className="hover:underline">
          Agent onboarding
        </Link>
      </p>
    </footer>
  );
}
