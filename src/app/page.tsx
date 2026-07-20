import { Suspense } from "react";
import { homeService } from "@/services/home";
import { HomeSectionRenderer } from "@/components/home/HomeSectionRenderer";
import { SkeletonHero, SkeletonCarouselSection } from "@/components/ui/Skeleton";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export const revalidate = 1800;

export default async function HomePage() {
  const homeData = await homeService.getHomeData();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content — accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      <Header />

      <main id="main-content">
        {homeData.sections.map((section, idx) => (
          <Suspense
            key={`${section.type}-${idx}`}
            fallback={
              <div className={section.type === "hero" ? "" : "container-padded"}>
                {section.type === "hero" && <SkeletonHero />}
                {(section.type === "carousel" ||
                  section.type === "recently-viewed" ||
                  section.type === "continue-reading") && (
                  <SkeletonCarouselSection
                    title={
                      section.type === "carousel"
                        ? section.title
                        : section.type === "recently-viewed"
                        ? "Recently Viewed"
                        : "Continue Reading"
                    }
                    className="mb-12"
                  />
                )}
              </div>
            }
          >
            <HomeSectionRenderer section={section} index={idx} />
          </Suspense>
        ))}
      </main>

      <Footer />
    </div>
  );
}