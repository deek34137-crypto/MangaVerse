export interface ProviderRatingInput {
  providerId: string;
  rating?: number | null; // e.g. 8.5 out of 10
  votesCount?: number;
  isOfficial?: boolean;
}

export class RatingsEngine {
  /**
   * Resolves rating from provider inputs.
   * NEVER displays fake 0. Converts missing/zero ratings to null ("Not Rated").
   */
  public resolveRating(inputs: ProviderRatingInput[]): { rating: number | null; formattedRating: string } {
    const validInputs = inputs.filter(
      (inp) => inp.rating !== undefined && inp.rating !== null && inp.rating > 0
    );

    if (validInputs.length === 0) {
      return { rating: null, formattedRating: "Not Rated" };
    }

    // Priority 1: Official provider rating
    const official = validInputs.find((i) => i.isOfficial);
    if (official && official.rating) {
      const num = parseFloat(official.rating.toFixed(2));
      return { rating: num, formattedRating: num.toFixed(1) };
    }

    // Priority 2: Provider with largest voting count
    const largestVote = validInputs.reduce((prev, curr) =>
      (curr.votesCount ?? 0) > (prev.votesCount ?? 0) ? curr : prev
    );

    if (largestVote && largestVote.votesCount && largestVote.votesCount > 50 && largestVote.rating) {
      const num = parseFloat(largestVote.rating.toFixed(2));
      return { rating: num, formattedRating: num.toFixed(1) };
    }

    // Priority 3: Weighted average across valid providers
    const sum = validInputs.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    const avg = parseFloat((sum / validInputs.length).toFixed(2));

    return { rating: avg, formattedRating: avg.toFixed(1) };
  }
}

export const ratingsEngine = new RatingsEngine();
