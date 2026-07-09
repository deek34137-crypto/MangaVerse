import { pgTable, uuid, varchar, text, integer, boolean, timestamp, decimal, jsonb, index, uniqueIndex, foreignKey, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatar: varchar("avatar", { length: 500 }),
  banner: varchar("banner", { length: 500 }),
  bio: text("bio"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
  usernameIdx: uniqueIndex("users_username_idx").on(table.username),
}));

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: varchar("theme", { length: 20 }).default("dark").notNull(),
  readingDirection: varchar("reading_direction", { length: 20 }).default("rtl").notNull(),
  pageTransition: varchar("page_transition", { length: 20 }).default("slide").notNull(),
  imageQuality: varchar("image_quality", { length: 20 }).default("high").notNull(),
  autoPlay: boolean("auto_play").default(false).notNull(),
  autoPlayDelay: integer("auto_play_delay").default(3000).notNull(),
  showMature: boolean("show_mature").default(false).notNull(),
  languages: jsonb("languages").default(["en"]).notNull(),
  notifications: jsonb("notifications").default({
    email: true,
    push: true,
    newChapter: true,
    libraryUpdates: true,
    recommendations: true,
    social: true,
  }).notNull(),
  privacy: jsonb("privacy").default({
    profileVisibility: "public",
    libraryVisibility: "public",
    historyVisibility: "private",
    activityVisibility: "public",
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userStats = pgTable("user_stats", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  mangaRead: integer("manga_read").default(0).notNull(),
  chaptersRead: integer("chapters_read").default(0).notNull(),
  timeSpent: integer("time_spent").default(0).notNull(),
  daysActive: integer("days_active").default(0).notNull(),
  favoriteGenres: jsonb("favorite_genres").default([]).notNull(),
  readingStreak: integer("reading_streak").default(0).notNull(),
  lastActiveDate: timestamp("last_active_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 50 }),
  scope: varchar("scope", { length: 500 }),
  idToken: text("id_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  providerAccountIdx: uniqueIndex("oauth_provider_account_idx").on(table.provider, table.providerAccountId),
  userIdx: index("oauth_user_idx").on(table.userId),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
  userIdx: index("sessions_user_idx").on(table.userId),
  expiresIdx: index("sessions_expires_idx").on(table.expiresAt),
}));

export const manga = pgTable("manga", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  altTitles: jsonb("alt_titles").default([]).notNull(),
  description: text("description"),
  coverImage: varchar("cover_image", { length: 500 }),
  bannerImage: varchar("banner_image", { length: 500 }),
  status: varchar("status", { length: 20 }).default("ongoing").notNull(),
  type: varchar("type", { length: 20 }).default("manga").notNull(),
  demographic: varchar("demographic", { length: 20 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0").notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),
  followCount: integer("follow_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  chapterCount: integer("chapter_count").default(0).notNull(),
  volumeCount: integer("volume_count").default(0).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  latestChapterId: uuid("latest_chapter_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  titleIdx: index("manga_title_idx").on(table.title),
  statusIdx: index("manga_status_idx").on(table.status),
  typeIdx: index("manga_type_idx").on(table.type),
  ratingIdx: index("manga_rating_idx").on(table.rating),
  followCountIdx: index("manga_follow_count_idx").on(table.followCount),
  updatedAtIdx: index("manga_updated_at_idx").on(table.updatedAt),
}));

export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  mangaCount: integer("manga_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  group: varchar("group", { length: 50 }).notNull(),
  description: text("description"),
  mangaCount: integer("manga_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authors = pgTable("authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  image: varchar("image", { length: 500 }),
  description: text("description"),
  mangaCount: integer("manga_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const artists = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  image: varchar("image", { length: 500 }),
  description: text("description"),
  mangaCount: integer("manga_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scanlatorGroups = pgTable("scanlator_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  website: varchar("website", { length: 500 }),
  discord: varchar("discord", { length: 500 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mangaGenres = pgTable("manga_genres", {
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  genreId: uuid("genre_id").notNull().references(() => genres.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.mangaId, table.genreId] }),
}));

export const mangaTags = pgTable("manga_tags", {
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.mangaId, table.tagId] }),
}));

export const mangaAuthors = pgTable("manga_authors", {
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => authors.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.mangaId, table.authorId] }),
}));

export const mangaArtists = pgTable("manga_artists", {
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.mangaId, table.artistId] }),
}));

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  number: decimal("number", { precision: 10, scale: 2 }).notNull(),
  volume: integer("volume"),
  title: varchar("title", { length: 500 }),
  language: varchar("language", { length: 10 }).default("en").notNull(),
  pageCount: integer("page_count").default(0).notNull(),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  mangaNumberIdx: uniqueIndex("chapters_manga_number_idx").on(table.mangaId, table.number, table.language),
  mangaIdx: index("chapters_manga_idx").on(table.mangaId),
  publishedAtIdx: index("chapters_published_at_idx").on(table.publishedAt),
}));

export const chapterPages = pgTable("chapter_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  chapterNumberIdx: uniqueIndex("chapter_pages_chapter_number_idx").on(table.chapterId, table.number),
  chapterIdx: index("chapter_pages_chapter_idx").on(table.chapterId),
}));

export const chapterScanlatorGroups = pgTable("chapter_scanlator_groups", {
  chapterId: uuid("chapter_id").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => scanlatorGroups.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.chapterId, table.groupId] }),
}));

export const library = pgTable("library", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("plan_to_read").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  progress: integer("progress").default(0).notNull(),
  lastReadChapterId: uuid("last_read_chapter_id").references(() => chapters.id, { onDelete: "set null" }),
  lastReadAt: timestamp("last_read_at"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  notes: text("notes"),
  tags: jsonb("tags").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userMangaIdx: uniqueIndex("library_user_manga_idx").on(table.userId, table.mangaId),
  userIdx: index("library_user_idx").on(table.userId),
  statusIdx: index("library_status_idx").on(table.status),
  updatedAtIdx: index("library_updated_at_idx").on(table.updatedAt),
}));

export const history = pgTable("history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  chapterId: uuid("chapter_id").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  progress: integer("progress").default(0).notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("history_user_idx").on(table.userId),
  mangaIdx: index("history_manga_idx").on(table.mangaId),
  readAtIdx: index("history_read_at_idx").on(table.readAt),
  userMangaChapterIdx: uniqueIndex("history_user_manga_chapter_idx").on(table.userId, table.mangaId, table.chapterId),
}));

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  score: decimal("score", { precision: 5, scale: 4 }).notNull(),
  reason: varchar("reason", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("recommendations_user_idx").on(table.userId),
  scoreIdx: index("recommendations_score_idx").on(table.score),
}));

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  isSpoiler: boolean("is_spoiler").default(false).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userMangaIdx: uniqueIndex("reviews_user_manga_idx").on(table.userId, table.mangaId),
  mangaIdx: index("reviews_manga_idx").on(table.mangaId),
  createdAtIdx: index("reviews_created_at_idx").on(table.createdAt),
}));

export const reviewVotes = pgTable("review_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userReviewIdx: uniqueIndex("review_votes_user_review_idx").on(table.userId, table.reviewId),
}));

export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  followerFollowingIdx: uniqueIndex("follows_follower_following_idx").on(table.followerId, table.followingId),
  followerIdx: index("follows_follower_idx").on(table.followerId),
  followingIdx: index("follows_following_idx").on(table.followingId),
}));

export const mangaFollows = pgTable("manga_follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userMangaIdx: uniqueIndex("manga_follows_user_manga_idx").on(table.userId, table.mangaId),
  userIdx: index("manga_follows_user_idx").on(table.userId),
  mangaIdx: index("manga_follows_manga_idx").on(table.mangaId),
}));

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, { fields: [users.id], references: [userPreferences.userId] }),
  stats: one(userStats, { fields: [users.id], references: [userStats.userId] }),
  oauthAccounts: many(oauthAccounts),
  sessions: many(sessions),
  library: many(library),
  history: many(history),
  recommendations: many(recommendations),
  reviews: many(reviews),
  reviewVotes: many(reviewVotes),
  following: many(follows, { relationName: "follower" }),
  followers: many(follows, { relationName: "following" }),
  mangaFollows: many(mangaFollows),
  notifications: many(notifications),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, { fields: [userStats.userId], references: [users.id] }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const mangaRelations = relations(manga, ({ one, many }) => ({
  genres: many(mangaGenres),
  tags: many(mangaTags),
  authors: many(mangaAuthors),
  artists: many(mangaArtists),
  chapters: many(chapters),
  library: many(library),
  history: many(history),
  recommendations: many(recommendations),
  reviews: many(reviews),
  follows: many(mangaFollows),
  latestChapter: one(chapters, { fields: [manga.latestChapterId], references: [chapters.id] }),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  manga: many(mangaGenres),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  manga: many(mangaTags),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  manga: many(mangaAuthors),
}));

export const artistsRelations = relations(artists, ({ many }) => ({
  manga: many(mangaArtists),
}));

export const scanlatorGroupsRelations = relations(scanlatorGroups, ({ many }) => ({
  chapters: many(chapterScanlatorGroups),
}));

export const mangaGenresRelations = relations(mangaGenres, ({ one }) => ({
  manga: one(manga, { fields: [mangaGenres.mangaId], references: [manga.id] }),
  genre: one(genres, { fields: [mangaGenres.genreId], references: [genres.id] }),
}));

export const mangaTagsRelations = relations(mangaTags, ({ one }) => ({
  manga: one(manga, { fields: [mangaTags.mangaId], references: [manga.id] }),
  tag: one(tags, { fields: [mangaTags.tagId], references: [tags.id] }),
}));

export const mangaAuthorsRelations = relations(mangaAuthors, ({ one }) => ({
  manga: one(manga, { fields: [mangaAuthors.mangaId], references: [manga.id] }),
  author: one(authors, { fields: [mangaAuthors.authorId], references: [authors.id] }),
}));

export const mangaArtistsRelations = relations(mangaArtists, ({ one }) => ({
  manga: one(manga, { fields: [mangaArtists.mangaId], references: [manga.id] }),
  artist: one(artists, { fields: [mangaArtists.artistId], references: [artists.id] }),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  manga: one(manga, { fields: [chapters.mangaId], references: [manga.id] }),
  pages: many(chapterPages),
  scanlatorGroups: many(chapterScanlatorGroups),
  library: many(library),
  history: many(history),
}));

export const chapterPagesRelations = relations(chapterPages, ({ one }) => ({
  chapter: one(chapters, { fields: [chapterPages.chapterId], references: [chapters.id] }),
}));

export const chapterScanlatorGroupsRelations = relations(chapterScanlatorGroups, ({ one }) => ({
  chapter: one(chapters, { fields: [chapterScanlatorGroups.chapterId], references: [chapters.id] }),
  group: one(scanlatorGroups, { fields: [chapterScanlatorGroups.groupId], references: [scanlatorGroups.id] }),
}));

export const libraryRelations = relations(library, ({ one }) => ({
  user: one(users, { fields: [library.userId], references: [users.id] }),
  manga: one(manga, { fields: [library.mangaId], references: [manga.id] }),
  lastReadChapter: one(chapters, { fields: [library.lastReadChapterId], references: [chapters.id] }),
}));

export const historyRelations = relations(history, ({ one }) => ({
  user: one(users, { fields: [history.userId], references: [users.id] }),
  manga: one(manga, { fields: [history.mangaId], references: [manga.id] }),
  chapter: one(chapters, { fields: [history.chapterId], references: [chapters.id] }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  user: one(users, { fields: [recommendations.userId], references: [users.id] }),
  manga: one(manga, { fields: [recommendations.mangaId], references: [manga.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  manga: one(manga, { fields: [reviews.mangaId], references: [manga.id] }),
  votes: many(reviewVotes),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  user: one(users, { fields: [reviewVotes.userId], references: [users.id] }),
  review: one(reviews, { fields: [reviewVotes.reviewId], references: [reviews.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "following" }),
}));

export const mangaFollowsRelations = relations(mangaFollows, ({ one }) => ({
  user: one(users, { fields: [mangaFollows.userId], references: [users.id] }),
  manga: one(manga, { fields: [mangaFollows.mangaId], references: [manga.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

