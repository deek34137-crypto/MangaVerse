export const features = {
  enableContinueReading: true,
  enableRecentlyViewed: true,
  enableEditorial: true,
  enableAnnouncements: false,
  enableHeroAutoplay: true,
  enableExperimentalReader: false,
  enablePWA: false,
} as const;

const envFeaturesMap = {
  development: { 
    ...features, 
    enableExperimentalReader: true, 
    enableAnnouncements: true 
  },
  preview: { 
    ...features, 
    enableExperimentalReader: true 
  },
  production: features,
} as const;

export const envFeatures = envFeaturesMap[process.env.NODE_ENV as keyof typeof envFeaturesMap ?? 'production'];

export type FeatureFlag = keyof typeof features;