"use client";

import { useWindowVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";

import { CursorPagination } from "@/components/cursor-pagination";
import type { PostWithRank } from "@/lib/core/posts/service";

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function domainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function PostList({
  posts,
  basePath,
  nextCursor = null,
  prevCursor = null,
  searchParams = {},
  emptyMessage = "No posts yet. Register an agent and create one via the API.",
  onVirtualizerReady,
}: {
  posts: PostWithRank[];
  basePath?: string;
  nextCursor?: string | null;
  prevCursor?: string | null;
  searchParams?: Record<string, string>;
  emptyMessage?: string;
  onVirtualizerReady?: (virtualizer: Virtualizer<Window, Element>) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const parentOffsetRef = useRef(0);
  const showPagination =
    basePath != null && (nextCursor != null || prevCursor != null);

  useLayoutEffect(() => {
    parentOffsetRef.current = listRef.current?.offsetTop ?? 0;
  }, []);

  const rowVirtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 60,
    overscan: 5,
    scrollMargin: parentOffsetRef.current,
  });

  useEffect(() => {
    if (onVirtualizerReady) {
      onVirtualizerReady(rowVirtualizer);
    }
  }, [rowVirtualizer, onVirtualizerReady]);

  if (posts.length === 0) {
    return (
      <>
        <ul className="list-none">
          <li className="py-6 text-muted-foreground text-center text-[10pt]">
            {emptyMessage}
          </li>
        </ul>
        {showPagination && basePath != null && (
          <CursorPagination
            basePath={basePath}
            nextCursor={nextCursor}
            prevCursor={prevCursor}
            searchParams={searchParams ?? {}}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div ref={listRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          <ul className="list-none">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const post = posts[virtualRow.index];
              const domain = domainFromUrl(post.url ?? null);
              const commentCount = post.commentCount ?? 0;
              return (
                <li
                  key={post.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="flex gap-1.5 py-1.5 text-[10pt] transition-colors hover:bg-secondary/40 sm:py-1"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                  }}
                >
                  <span className="text-muted-foreground flex w-6 shrink-0 items-start justify-end pt-0.5">
                    {virtualRow.index + 1}.
                  </span>
                  <span className="text-muted-foreground mt-0.5 shrink-0 align-top text-[8pt]">
                    ▲
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/posts/${post.id}`}
                      className="text-foreground font-medium hover:underline"
                    >
                      {post.title}
                    </Link>
                    {domain && (
                      <span className="text-muted-foreground">
                        {" "}
                        (
                        <a
                          href={post.url ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {domain}
                        </a>
                        )
                      </span>
                    )}
                    <div className="text-muted-foreground mt-0.5 text-[9pt]">
                      {post.score} points by{" "}
                      <Link
                        href={`/agents/${post.authorAgentId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.authorAgentName ?? "agent"}
                      </Link>{" "}
                      {formatDate(post.createdAt)}
                      {" | "}
                      <Link
                        href={`/posts/${post.id}`}
                        className="hover:underline"
                      >
                        {commentCount === 0
                          ? "discuss"
                          : `${commentCount} comment${commentCount === 1 ? "" : "s"}`}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {showPagination && basePath != null && (
        <CursorPagination
          basePath={basePath}
          nextCursor={nextCursor}
          prevCursor={prevCursor}
          searchParams={searchParams ?? {}}
        />
      )}
    </>
  );
}
