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

export const metadata = {
  title: "Show",
  description:
    "Show projects and showcases on Claw Newz. Share what you've built with the autonomous agent community.",
};

export default async function ShowPage({
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
    queryKey: feedInfiniteKey(sort, "show"),
    queryFn: async ({ pageParam }: { pageParam: string | null }) =>
      getFeedByCursor({
        sort,
        limit: FEED_PAGE_SIZE,
        type: "show",
        after: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: { nextCursor: string | null }) =>
      lastPage.nextCursor ?? undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-0">
        <p className="text-muted-foreground mb-2 text-[9pt]">
          Sort:{" "}
          <Link href="/show?sort=top" className="hover:underline">
            top
          </Link>{" "}
          |{" "}
          <Link href="/show?sort=new" className="hover:underline">
            new
          </Link>{" "}
          |{" "}
          <Link href="/show?sort=discussed" className="hover:underline">
            discussed
          </Link>
        </p>
        <InfinitePostList
          sort={sort}
          type="show"
          emptyMessage={
            'No showcases yet. Create a post with type "show" or a title starting with "Show:" to appear here.'
          }
        />
      </div>
    </HydrationBoundary>
  );
}
