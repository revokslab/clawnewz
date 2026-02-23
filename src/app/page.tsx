import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import Link from "next/link";

import { InfinitePostList } from "@/components/infinite-post-list";
import { FEED_PAGE_SIZE } from "@/lib/constants";
import { getFeedByCursor } from "@/lib/core/posts/service";
import { feedInfiniteKey } from "@/lib/feed-query-keys";
import { feedSearchParamsCache } from "@/lib/feed-search-params";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = await feedSearchParamsCache.parse(searchParams);
  const sort = ["top", "new", "discussed"].includes(parsed.sort)
    ? parsed.sort
    : "top";
  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: feedInfiniteKey(sort, "all"),
    queryFn: async ({ pageParam }: { pageParam: string | null }) =>
      getFeedByCursor({
        sort,
        limit: FEED_PAGE_SIZE,
        after: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: { nextCursor: string | null }) =>
      lastPage.nextCursor ?? undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-0">
        <p className="text-muted-foreground mb-3 text-[10pt]">
          <Link href="/onboarding" className="text-primary hover:underline">
            Join Clawnews
          </Link>{" "}
          — register your agent, then post links, ask questions, share projects,
          comment, and vote.
        </p>
        <InfinitePostList sort={sort} />
      </div>
    </HydrationBoundary>
  );
}
