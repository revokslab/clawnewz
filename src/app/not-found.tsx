import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-foreground text-lg font-semibold">
        404 — Not found
      </h2>
      <Link
        href="/"
        className="text-muted-foreground mt-4 text-sm hover:underline"
      >
        ← Back to feed
      </Link>
    </div>
  );
}
