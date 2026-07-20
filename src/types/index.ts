export interface Manga {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  coverImage: string;
  bannerImage?: string;
  status: MangaStatus;
  type: MangaType;
  genres: Genre[];
  tags: Tag[];
  authors: Author[];
  artists: Artist[];
  demographic: Demographic;
  rating: number;
  ratingCount: number;
  followCount: number;
  viewCount: number;
  chapterCount: number;
  volumeCount: number;
  startDate?: string;
  endDate?: string;
  latestChapter?: Chapter;
  createdAt: string;
  updatedAt: string;
  userData?: UserMangaData;
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: number | null;
  volume?: number;
  type: string;
  title?: string;
  language: string;
  pages: ChapterPage[];
  pageCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  scanlatorGroups: ScanlatorGroup[];
  userData?: UserChapterData;
  provider: string;
  providerChapterId: string;
}

export interface ChapterPage {
  id: string;
  chapterId: string;
  number: number;
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  mangaCount: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  group: TagGroup;
  description?: string;
  mangaCount: number;
}

export interface TagGroup {
  id: string;
  name: string;
  slug: string;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  mangaCount: number;
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  mangaCount: number;
}

export interface ScanlatorGroup {
  id: string;
  name: string;
  slug: string;
  website?: string;
  discord?: string;
  description?: string;
}

export interface UserMangaData {
  status: LibraryStatus;
  rating?: number;
  progress: number;
  lastReadChapterId?: string;
  lastReadAt?: string;
  isFavorite: boolean;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserChapterData {
  isRead: boolean;
  readAt?: string;
  progress: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  theme: Theme;
  readingDirection: ReadingDirection;
  pageTransition: PageTransition;
  imageQuality: ImageQuality;
  autoPlay: boolean;
  autoPlayDelay: number;
  showMature: boolean;
  language: string[];
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  newChapter: boolean;
  libraryUpdates: boolean;
  recommendations: boolean;
  social: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: ProfileVisibility;
  libraryVisibility: LibraryVisibility;
  historyVisibility: HistoryVisibility;
  activityVisibility: ActivityVisibility;
}

export interface UserStats {
  mangaRead: number;
  chaptersRead: number;
  timeSpent: number;
  daysActive: number;
  favoriteGenres: string[];
  readingStreak: number;
}

export interface LibraryEntry {
  id: string;
  userId: string;
  mangaId: string;
  manga: Manga;
  status: LibraryStatus;
  rating?: number;
  progress: number;
  currentChapter?: number;
  lastReadChapterId?: string;
  lastReadAt?: string;
  isFavorite: boolean;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  mangaId: string;
  chapterId: string;
  manga: Manga;
  chapter: Chapter;
  progress: number;
  readAt: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  mangaId: string;
  manga: Manga;
  score: number;
  reason: RecommendationReason;
  createdAt: string;
}

export interface SearchFilters {
  query?: string;
  genres?: string[];
  tags?: string[];
  authors?: string[];
  artists?: string[];
  status?: MangaStatus[];
  type?: MangaType[];
  demographic?: Demographic[];
  rating?: number;
  year?: number;
  season?: Season[];
  language?: string[];
  sortBy?: SortOption;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  manga: Manga[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  genres: FacetCount[];
  tags: FacetCount[];
  authors: FacetCount[];
  status: FacetCount[];
  type: FacetCount[];
  demographic: FacetCount[];
  year: FacetCount[];
}

export interface FacetCount {
  value: string;
  label: string;
  count: number;
}

export type MangaStatus = "ongoing" | "completed" | "hiatus" | "cancelled" | "upcoming";
export type MangaType = "manga" | "manhwa" | "manhua" | "novel" | "oneshot" | "doujinshi";
export type Demographic = "shounen" | "seinen" | "shoujo" | "josei" | "kodomomuke";
export type LibraryStatus = "reading" | "completed" | "on_hold" | "dropped" | "plan_to_read" | "rereading";
export type UserRole = "user" | "moderator" | "admin" | "premium";
export type Theme = "dark" | "light" | "system";
export type ReadingDirection = "rtl" | "ltr" | "vertical" | "webtoon";
export type PageTransition = "slide" | "fade" | "curl" | "none";
export type ImageQuality = "low" | "medium" | "high" | "original";
export type ProfileVisibility = "public" | "friends" | "private";
export type LibraryVisibility = "public" | "friends" | "private";
export type HistoryVisibility = "public" | "friends" | "private";
export type ActivityVisibility = "public" | "friends" | "private";
export type SortOption = "relevance" | "title" | "rating" | "popularity" | "updated" | "created" | "follows" | "views";
export type SortOrder = "asc" | "desc";
export type Season = "winter" | "spring" | "summer" | "fall";
export type RecommendationReason = 
  | "similar_genre" 
  | "similar_author" 
  | "similar_artist" 
  | "popular_in_demographic" 
  | "highly_rated" 
  | "trending" 
  | "completed_series" 
  | "user_preference" 
  | "collaborative_filtering";

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  preferences: UserPreferences;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ReadingSession {
  mangaId: string;
  chapterId: string;
  page: number;
  progress: number;
  startTime: number;
  lastUpdate: number;
  direction: ReadingDirection;
}

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "avif" | "webp" | "jpeg" | "png";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}