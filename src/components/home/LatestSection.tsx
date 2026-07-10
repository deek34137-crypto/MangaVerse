import { MangaSection } from "./MangaSection";

interface LatestSectionProps {
  latest: { manga: any[]; total: number };
}

export function LatestSection({ latest }: LatestSectionProps) {
  return (
    <MangaSection
      title="Latest Updates"
      subtitle={`${latest.total}+ recently updated`}
      manga={latest.manga}
      href="/search?sort=updated"
      viewAllLabel="View Latest"
    />
  );
}