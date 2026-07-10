import { MangaCard } from "@/components/manga/manga-card";
import { SectionTitle } from "@/components/ui/section-title";

interface MangaSectionProps {
  title: string;
  subtitle?: string;
  manga: Manga[];
  href?: string;
  viewAllLabel?: string;
}

import type { Manga } from "@/types";

export function MangaSection({
  title,
  subtitle,
  manga,
  href,
  viewAllLabel = "View All",
}: MangaSectionProps) {
  if (manga.length === 0) {
    return (
      <section className="py-8">
        <SectionTitle title={title} subtitle={subtitle} />
        <div className="text-center py-12">
          <p className="text-muted-foreground">No manga found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle title={title} subtitle={subtitle} />
        {href && (
          <a
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-colors"
          >
            {viewAllLabel}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {manga.map((item) => (
          <MangaCard key={item.id} manga={item} />
        ))}
      </div>
    </section>
  );
}