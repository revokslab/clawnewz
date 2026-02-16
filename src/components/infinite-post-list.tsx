"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { Virtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";

import { PostList } from "@/components/post-list";
import { FEED_PAGE_SIZE } from "@/lib/constants";
import type { PostWithRank } from "@/lib/core/posts/service";
import { type FeedType, feedInfiniteKey } from "@/lib/feed-query-keys";

type InfinitePostListProps = {
  sort: "top" | "new" | "discussed";
  type?: "ask" | "show";
  emptyMessage?: string;
};

export function InfinitePostList({
  sort,
  type,
  emptyMessage,
}: InfinitePostListProps) {
  const virtualizerRef = useRef<Virtualizer<Window, Element> | null>(null);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: feedInfiniteKey(sort, (type ?? "all") as FeedType),
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const params = new URLSearchParams({
        sort,
        limit: String(FEED_PAGE_SIZE),
      });
      if (pageParam != null) params.set("after", pageParam);
      if (type) params.set("type", type);
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{
        posts: PostWithRank[];
        nextCursor: string | null;
        prevCursor: string | null;
      }>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const hasCachedPages = (data?.pages?.length ?? 0) > 0;
  const [virtualizerReady, setVirtualizerReady] = useState(false);

  useEffect(() => {
    const virtualizer = virtualizerRef.current;
    if (!virtualizer || !virtualizerReady) return;

    const checkAndFetch = () => {
      const virtualItems = virtualizer.getVirtualItems();
      if (virtualItems.length === 0) return;

      const lastItem = virtualItems[virtualItems.length - 1];
      if (
        lastItem &&
        lastItem.index >= posts.length - 1 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    // Check immediately
    checkAndFetch();

    // Also check when virtualizer items change (on scroll)
    const scrollElement = virtualizer.options.getScrollElement();
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkAndFetch);
      return () => {
        scrollElement.removeEventListener("scroll", checkAndFetch);
      };
    }
  }, [
    hasNextPage,
    fetchNextPage,
    posts.length,
    isFetchingNextPage,
    virtualizerReady,
  ]);

  if (status === "pending" && !hasCachedPages) {
    return (
      <p className="text-muted-foreground py-3 text-center text-[10pt]">
        Loading…
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-muted-foreground py-3 text-center text-[10pt]">
        {error instanceof Error ? error.message : "Failed to load"}
      </p>
    );
  }

  return (
    <>
      <PostList
        posts={posts}
        emptyMessage={emptyMessage}
        onVirtualizerReady={(virtualizer) => {
          virtualizerRef.current = virtualizer;
          setVirtualizerReady(true);
        }}
      />
      {isFetchingNextPage && (
        <p className="text-muted-foreground py-3 text-center text-[10pt]">
          Loading…
        </p>
      )}
      {!hasNextPage && posts.length > 0 && (
        <p className="text-muted-foreground py-3 text-center text-[10pt]">
          No more posts
        </p>
      )}
    </>
  );
}
