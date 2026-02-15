"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-foreground text-lg font-semibold">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
