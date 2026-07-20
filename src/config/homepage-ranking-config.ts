/**
 * Configuration weights and penalty values for the Homepage Content Engine.
 */
export const HOMEPAGE_RANKING_CONFIG = {
  /**
   * Weights used to calculate the BaseScore of a candidate.
   * All weights should sum to 1.0.
   */
  weights: {
    popularity: 0.40, // Weight for follower/view count
    freshness: 0.20,  // Weight for how recently the series was updated
    rating: 0.20,     // Weight for user ratings
    noise: 0.20,      // Weight for stable daily random noise
  },

  /**
   * Soft penalty values deducted from a candidate's score when overlaps
   * occur with already selected homepage titles.
   */
  penalties: {
    genre: 5,           // Penalty per overlapping genre
    author: 25,         // Penalty if the author is already featured
    provider: 15,       // Base penalty per occurrences of the provider
    demographic: 10,    // Penalty for demographic overlap (e.g., Shounen, Shoujo)
    franchise: 100,     // Strong penalty for same franchise/spinoff (via title stem)
    status: 3,          // Penalty for status overlap (ongoing/completed)
  },

  /**
   * Selection limits and pool settings.
   */
  pool: {
    factor: 5,          // Fetch (requiredCards * factor) candidates from the DB
    minPoolSize: 20,    // Hard minimum candidate pool size
  },
};
