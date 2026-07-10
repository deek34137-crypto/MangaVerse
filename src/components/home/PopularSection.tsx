import { MangaSection } from "./MangaSection";

interface PopularSectionProps {
  popular: { manga: any[]; total: number };
}

export function PopularSection({ popular }: PopularSectionProps) {
  return (
    <MangaSection
      title="Most Popular"
      subtitle={`${popular.total}+ manga by followers`}
      manga={popular.manga}
      href="/search?sort=popularity"
      viewAllLabel="View Popular"
    />
  );
}