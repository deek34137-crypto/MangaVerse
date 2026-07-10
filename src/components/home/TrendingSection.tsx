import { MangaSection } from "./MangaSection";

interface TrendingSectionProps {
  trending: { manga: any[]; total: number };
}

export function TrendingSection({ trending }: TrendingSectionProps) {
  return (
    <MangaSection
      title="Trending Now"
      subtitle={`${trending.total}+ manga trending this week`}
      manga={trending.manga}
      href="/search?sort=updated"
      viewAllLabel="View All Trending"
    />
  );
}