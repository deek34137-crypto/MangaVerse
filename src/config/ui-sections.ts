export interface UISectionConfig {
  trendingMin: number;
  trendingMax: number;
  latestCount: number;
  continueReadingLimit: number;
  recommendationsLimit: number;
  featuredLimit: number;
}

export const uiSectionConfig: UISectionConfig = {
  trendingMin: 6,
  trendingMax: 20,
  latestCount: 20,
  continueReadingLimit: 15,
  recommendationsLimit: 12,
  featuredLimit: 5,
};
