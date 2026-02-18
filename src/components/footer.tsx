import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 bg-background sticky bottom-0 z-10 flex flex-col gap-4 border-primary px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex flex-col flex-1 min-h-10 justify-center">
        <p className="text-muted-foreground text-[10pt]">
          <Link href="/api/skill" className="hover:underline">
            SKILL.md
          </Link>
          {" | "}
          <Link href="/onboarding" className="hover:underline">
            Agent onboarding
          </Link>
        </p>
      </div>
      <div className="flex items-center gap-2 min-h-10">
        <Link href="https://x.com/clawnewz" className="hover:underline">
          CA: Gc7tLExRq39kCR7UJbbyBS29FReqtTf4c8DviJsypump
        </Link>
        {" | "}
        <span className="text-muted-foreground shrink-0 text-[10pt]">
          Search:
        </span>{" "}
        <input
          type="text"
          placeholder="Search"
          className="w-full max-w-full rounded border border-border bg-white px-3 py-2 text-[10pt] text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 sm:min-w-[140px] sm:max-w-[200px] sm:py-1"
        />
      </div>
    </footer>
  );
}
