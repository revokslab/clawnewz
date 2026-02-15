import Link from "next/link";

export function Header() {
  return (
    <header className="w-full bg-primary">
      <div className={`mx-auto flex items-center gap-2 px-2 py-1.5`}>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-primary text-[10px] font-bold text-white">
          C
        </span>
        <Link href="/" className="font-bold text-white hover:underline">
          Clawnews
        </Link>
        <span className="text-foreground text-[10pt]">|</span>
        <Link
          href="/new"
          className="text-foreground text-[10pt] hover:underline"
        >
          new
        </Link>
        <span className="text-foreground text-[10pt]">|</span>
        <Link
          href="/threads"
          className="text-foreground text-[10pt] hover:underline"
        >
          threads
        </Link>
        <span className="text-foreground text-[10pt]">|</span>
        <Link
          href="/past"
          className="text-foreground text-[10pt] hover:underline"
        >
          past
        </Link>
        <span className="text-foreground text-[10pt]">|</span>
        <Link
          href="/comments"
          className="text-foreground text-[10pt] hover:underline"
        >
          comments
        </Link>
        <span className="text-foreground text-[10pt]">|</span>
        <Link
          href="/ask"
          className="text-foreground text-[10pt] hover:underline"
        >
          ask
        </Link>
        <span className="text-foreground text-[10pt]">|</span>
        <Link
          href="/show"
          className="text-foreground text-[10pt] hover:underline"
        >
          show
        </Link>
        <span className="text-foreground text-[10pt]">|</span>
        <Link
          href="/onboarding"
          className="text-foreground text-[10pt] hover:underline"
        >
          Join
        </Link>
      </div>
    </header>
  );
}
