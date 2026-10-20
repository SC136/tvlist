import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                 Auth tables                                */
/*        Shape required by Better Auth (core schema + username plugin).      */
/* -------------------------------------------------------------------------- */

export const scoreFormatEnum = pgEnum("score_format", [
  "POINT_100",
  "POINT_10_DECIMAL",
  "POINT_10",
  "POINT_5",
  "POINT_3",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  // Profile customisation
  about: text("about"),
  bannerImage: text("banner_image"),
  website: text("website"),
  location: text("location"),
  statusQuote: text("status_quote"),
  defaultTab: text("default_tab").notNull().default("overview"),
  /** "auto" follows the visitor's palette; otherwise a palette id. */
  profileColor: text("profile_color").notNull().default("auto"),
  scoreFormat: scoreFormatEnum("score_format").notNull().default("POINT_10_DECIMAL"),
  /** "user" | "moderator" | "admin" */
  role: text("role").notNull().default("user"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* -------------------------------------------------------------------------- */
/*                                 Media cache                                */
/*   A local snapshot of TMDB titles that appear in someone's list, so list   */
/*   pages and stats never need one TMDB request per row.                     */
/* -------------------------------------------------------------------------- */

export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv", "anime", "game", "manga", "book", "music"]);

export type MediaPerson = {
  id: number;
  name: string;
  profilePath: string | null;
  /** "cast" | "director" | "creator" | "writer" */
  role: string;
};

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    type: mediaTypeEnum("type").notNull(),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    title: text("title").notNull(),
    originalTitle: text("original_title"),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    releaseDate: date("release_date"),
    year: integer("year"),
    /** "Movie" | "TV" | "Miniseries" | "Docuseries" | "Reality" | "Talk Show" | ... */
    format: text("format"),
    genres: jsonb("genres").$type<string[]>().notNull().default([]),
    studios: jsonb("studios").$type<string[]>().notNull().default([]),
    people: jsonb("people").$type<MediaPerson[]>().notNull().default([]),
    country: text("country"),
    originalLanguage: text("original_language"),
    /** Minutes. For TV this is the typical episode length. */
    runtime: integer("runtime"),
    /** Total episodes for TV; always 1 for movies. */
    episodes: integer("episodes"),
    seasons: integer("seasons"),
    status: text("status"),
    voteAverage: real("vote_average"),
    nextEpisodeAirDate: date("next_episode_air_date"),
    nextEpisodeNumber: integer("next_episode_number"),
    nextEpisodeSeason: integer("next_episode_season"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("media_type_tmdb_idx").on(t.type, t.tmdbId)],
);

/* -------------------------------------------------------------------------- */
/*                                 List entries                               */
/* -------------------------------------------------------------------------- */

export const listStatusEnum = pgEnum("list_status", [
  "CURRENT",
  "PLANNING",
  "COMPLETED",
  "DROPPED",
  "PAUSED",
  "REPEATING",
]);

export const listEntry = pgTable(
  "list_entry",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    status: listStatusEnum("status").notNull(),
    /** Stored on a 0–100 scale; rendered in each viewer's score format. 0 = unscored. */
    score: integer("score").notNull().default(0),
    progress: integer("progress").notNull().default(0),
    repeat: integer("repeat").notNull().default(0),
    startedAt: date("started_at"),
    completedAt: date("completed_at"),
    notes: text("notes"),
    private: boolean("private").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("list_entry_user_media_idx").on(t.userId, t.mediaId),
    index("list_entry_media_idx").on(t.mediaId),
  ],
);

export const favourite = pgTable(
  "favourite",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.mediaId] })],
);

export const favouritePerson = pgTable(
  "favourite_person",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    personId: integer("person_id").notNull(),
    name: text("name").notNull(),
    profilePath: text("profile_path"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.personId] })],
);

/** Diary: one row per viewing. */
export const diaryEntry = pgTable(
  "diary_entry",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    watchedOn: date("watched_on").notNull(),
    /** 0–100, 0 = no rating for this viewing. */
    score: integer("score").notNull().default(0),
    rewatch: boolean("rewatch").notNull().default(false),
    liked: boolean("liked").notNull().default(false),
    /** For TV: which season this log is for (null = whole show). */
    season: integer("season"),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("diary_user_idx").on(t.userId, t.watchedOn),
    index("diary_media_idx").on(t.mediaId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                   Social                                   */
/* -------------------------------------------------------------------------- */

export const activityTypeEnum = pgEnum("activity_type", ["LIST", "TEXT", "MESSAGE"]);

export const activity = pgTable(
  "activity",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    mediaId: integer("media_id").references(() => media.id, { onDelete: "cascade" }),
    /** MESSAGE activities: the profile the message was posted on. */
    recipientId: text("recipient_id").references(() => user.id, { onDelete: "cascade" }),
    /** For LIST activities: e.g. "watched episode", "completed", "plans to watch". */
    status: text("status"),
    /** For LIST activities: e.g. "4 - 6" (episode range). */
    progress: text("progress"),
    /** For TEXT / MESSAGE activities: the post body. */
    text: text("text"),
    /** Private messages are only visible to sender and recipient. */
    private: boolean("private").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("activity_user_idx").on(t.userId, t.createdAt),
    index("activity_recipient_idx").on(t.recipientId, t.createdAt),
    index("activity_media_idx").on(t.mediaId, t.createdAt),
    index("activity_created_idx").on(t.createdAt),
  ],
);

export const activityLike = pgTable(
  "activity_like",
  {
    activityId: integer("activity_id")
      .notNull()
      .references(() => activity.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.activityId, t.userId] })],
);

export const activityReply = pgTable(
  "activity_reply",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activity.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("activity_reply_activity_idx").on(t.activityId)],
);

export const follow = pgTable(
  "follow",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("follow_following_idx").on(t.followingId),
  ],
);

/** Likes on things other than activities (replies, forum posts, custom lists, reviews). */
export const likeTargetEnum = pgEnum("like_target", ["REPLY", "THREAD", "COMMENT", "COLLECTION"]);

export const contentLike = pgTable(
  "content_like",
  {
    target: likeTargetEnum("target").notNull(),
    targetId: integer("target_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.target, t.targetId, t.userId] }),
    index("content_like_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                   Reviews                                  */
/* -------------------------------------------------------------------------- */

export const review = pgTable(
  "review",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    /** 0–100 */
    score: integer("score").notNull(),
    containsSpoilers: boolean("contains_spoilers").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("review_user_media_idx").on(t.userId, t.mediaId),
    index("review_media_idx").on(t.mediaId),
    index("review_created_idx").on(t.createdAt),
  ],
);

/** "Was this review helpful?" — +1 / -1 per user. */
export const reviewRating = pgTable(
  "review_rating",
  {
    reviewId: integer("review_id")
      .notNull()
      .references(() => review.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.reviewId, t.userId] })],
);

/* -------------------------------------------------------------------------- */
/*                              Custom lists                                  */
/* -------------------------------------------------------------------------- */

export const collection = pgTable(
  "collection",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    ranked: boolean("ranked").notNull().default(false),
    private: boolean("private").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("collection_user_idx").on(t.userId), index("collection_updated_idx").on(t.updatedAt)],
);

export const collectionItem = pgTable(
  "collection_item",
  {
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collection.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.mediaId] }),
    index("collection_item_media_idx").on(t.mediaId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                    Forum                                   */
/* -------------------------------------------------------------------------- */

export const forumCategoryEnum = pgEnum("forum_category", [
  "GENERAL",
  "MOVIES",
  "TV",
  "ANIME",
  "MANGA",
  "GAMES",
  "BOOKS",
  "MUSIC",
  "EPISODE_DISCUSSION",
  "RECOMMENDATIONS",
  "NEWS",
  "SITE_FEEDBACK",
  "OFF_TOPIC",
]);

export const forumThread = pgTable(
  "forum_thread",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    category: forumCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    mediaId: integer("media_id").references(() => media.id, { onDelete: "set null" }),
    pinned: boolean("pinned").notNull().default(false),
    locked: boolean("locked").notNull().default(false),
    replyCount: integer("reply_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    lastReplyAt: timestamp("last_reply_at"),
    lastReplyUserId: text("last_reply_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("forum_thread_category_idx").on(t.category, t.lastReplyAt),
    index("forum_thread_media_idx").on(t.mediaId),
  ],
);

export const forumComment = pgTable(
  "forum_comment",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id")
      .notNull()
      .references(() => forumThread.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** One level of nesting. */
    parentId: integer("parent_id"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("forum_comment_thread_idx").on(t.threadId, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*                                Notifications                               */
/* -------------------------------------------------------------------------- */

export const notificationTypeEnum = pgEnum("notification_type", [
  "FOLLOWING",
  "ACTIVITY_LIKE",
  "ACTIVITY_REPLY",
  "ACTIVITY_MESSAGE",
  "ACTIVITY_MENTION",
  "REPLY_LIKE",
  "THREAD_REPLY",
  "THREAD_COMMENT_LIKE",
  "COLLECTION_LIKE",
  "AIRING",
]);

export const notification = pgTable(
  "notification",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "cascade" }),
    activityId: integer("activity_id").references(() => activity.id, { onDelete: "cascade" }),
    threadId: integer("thread_id").references(() => forumThread.id, { onDelete: "cascade" }),
    collectionId: integer("collection_id").references(() => collection.id, { onDelete: "cascade" }),
    mediaId: integer("media_id").references(() => media.id, { onDelete: "cascade" }),
    /** Extra context, e.g. the episode number for AIRING notifications. */
    context: text("context"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notification_user_idx").on(t.userId, t.read, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*                                  Relations                                 */
/* -------------------------------------------------------------------------- */

export const userRelations = relations(user, ({ many }) => ({
  entries: many(listEntry),
  favourites: many(favourite),
  activities: many(activity, { relationName: "activityAuthor" }),
  reviews: many(review),
}));

export const mediaRelations = relations(media, ({ many }) => ({
  entries: many(listEntry),
  reviews: many(review),
}));

export const listEntryRelations = relations(listEntry, ({ one }) => ({
  user: one(user, { fields: [listEntry.userId], references: [user.id] }),
  media: one(media, { fields: [listEntry.mediaId], references: [media.id] }),
}));

export const favouriteRelations = relations(favourite, ({ one }) => ({
  user: one(user, { fields: [favourite.userId], references: [user.id] }),
  media: one(media, { fields: [favourite.mediaId], references: [media.id] }),
}));

export const diaryEntryRelations = relations(diaryEntry, ({ one }) => ({
  user: one(user, { fields: [diaryEntry.userId], references: [user.id] }),
  media: one(media, { fields: [diaryEntry.mediaId], references: [media.id] }),
}));

export const activityRelations = relations(activity, ({ one, many }) => ({
  user: one(user, { fields: [activity.userId], references: [user.id], relationName: "activityAuthor" }),
  recipient: one(user, { fields: [activity.recipientId], references: [user.id], relationName: "activityRecipient" }),
  media: one(media, { fields: [activity.mediaId], references: [media.id] }),
  likes: many(activityLike),
  replies: many(activityReply),
}));

export const activityLikeRelations = relations(activityLike, ({ one }) => ({
  activity: one(activity, { fields: [activityLike.activityId], references: [activity.id] }),
  user: one(user, { fields: [activityLike.userId], references: [user.id] }),
}));

export const activityReplyRelations = relations(activityReply, ({ one }) => ({
  activity: one(activity, { fields: [activityReply.activityId], references: [activity.id] }),
  user: one(user, { fields: [activityReply.userId], references: [user.id] }),
}));

export const reviewRelations = relations(review, ({ one, many }) => ({
  user: one(user, { fields: [review.userId], references: [user.id] }),
  media: one(media, { fields: [review.mediaId], references: [media.id] }),
  ratings: many(reviewRating),
}));

export const reviewRatingRelations = relations(reviewRating, ({ one }) => ({
  review: one(review, { fields: [reviewRating.reviewId], references: [review.id] }),
}));

export const collectionRelations = relations(collection, ({ one, many }) => ({
  user: one(user, { fields: [collection.userId], references: [user.id] }),
  items: many(collectionItem),
}));

export const collectionItemRelations = relations(collectionItem, ({ one }) => ({
  collection: one(collection, { fields: [collectionItem.collectionId], references: [collection.id] }),
  media: one(media, { fields: [collectionItem.mediaId], references: [media.id] }),
}));

export const forumThreadRelations = relations(forumThread, ({ one, many }) => ({
  user: one(user, { fields: [forumThread.userId], references: [user.id], relationName: "threadAuthor" }),
  lastReplyUser: one(user, {
    fields: [forumThread.lastReplyUserId],
    references: [user.id],
    relationName: "threadLastReply",
  }),
  media: one(media, { fields: [forumThread.mediaId], references: [media.id] }),
  comments: many(forumComment),
}));

export const forumCommentRelations = relations(forumComment, ({ one }) => ({
  thread: one(forumThread, { fields: [forumComment.threadId], references: [forumThread.id] }),
  user: one(user, { fields: [forumComment.userId], references: [user.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id], relationName: "notificationOwner" }),
  actor: one(user, { fields: [notification.actorId], references: [user.id], relationName: "notificationActor" }),
  activity: one(activity, { fields: [notification.activityId], references: [activity.id] }),
  thread: one(forumThread, { fields: [notification.threadId], references: [forumThread.id] }),
  collection: one(collection, { fields: [notification.collectionId], references: [collection.id] }),
  media: one(media, { fields: [notification.mediaId], references: [media.id] }),
}));

export type User = typeof user.$inferSelect;
export type Media = typeof media.$inferSelect;
export type ListEntry = typeof listEntry.$inferSelect;
export type ListStatus = (typeof listStatusEnum.enumValues)[number];
export type ScoreFormat = (typeof scoreFormatEnum.enumValues)[number];
export type MediaType = (typeof mediaTypeEnum.enumValues)[number];
export type ForumCategory = (typeof forumCategoryEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
