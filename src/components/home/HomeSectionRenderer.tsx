"use client";

import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { HeroCarousel } from "./HeroCarousel";
import { ContinueReadingSection } from "./ContinueReadingSection";
import { MangaCarousel } from "./MangaCarousel";
import { GenresSection } from "./GenresSection";
import { AnnouncementsSection } from "./AnnouncementsSection";
import type { HomeSection, HeroManga, Manga, ContinueReadingItem, Genre, Announcement } from "@/services/home/types";

interface HomeSectionRendererProps {
  section: HomeSection;
  /** Section index — drives stagger delay and spacing logic */
  index?: number;
}

export function HomeSectionRenderer({ section, index = 0 }: HomeSectionRendererProps) {
  const isHero = section.type === "hero";

  return (
    <SectionErrorBoundary fallback={<div className="h-16" />}>
      {/* Hero is full-bleed; all other sections are padded with 64px print rhythm */}
      <div className={isHero ? "" : "container-padded mb-16"}>
        {(() => {
          switch (section.type) {
            case "hero": {
              const data = section.data as HeroManga | null;
              if (!data?.manga) return null;
              return (
                <HeroCarousel
                  featured={[data.manga]}
                  className="mb-16"
                />
              );
            }

            case "carousel": {
              const data = section.data as Manga[];
              if (!data?.length) return null;
              return (
                <MangaCarousel
                  title={section.title}
                  items={data}
                  viewAllHref="/search"
                  showFade
                  showIndicators
                />
              );
            }

            case "continue-reading": {
              const data = section.data as ContinueReadingItem[];
              return (
                <ContinueReadingSection
                  items={data}
                />
              );
            }

            case "recently-viewed": {
              const data = section.data as Manga[];
              if (!data?.length) return null;
              return (
                <MangaCarousel
                  title="Recently Viewed"
                  items={data}
                  viewAllHref="/history"
                  showFade
                />
              );
            }

            case "genres": {
              const data = section.data as Genre[];
              if (!data?.length) return null;
              return (
                <GenresSection
                  genres={data}
                />
              );
            }

            case "announcements": {
              const data = section.data as Announcement[];
              if (!data?.length) return null;
              return (
                <AnnouncementsSection
                  announcements={data}
                />
              );
            }

            default:
              return null;
          }
        })()}
      </div>
    </SectionErrorBoundary>
  );
}

export { SectionErrorBoundary } from "./SectionErrorBoundary";