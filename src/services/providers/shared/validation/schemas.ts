import { z } from "zod";

export const RawProviderMangaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  altTitles: z.array(z.string()).optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  bannerImage: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  demographic: z.string().optional(),
  genres: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  authors: z.array(z.string()).default([]),
  artists: z.array(z.string()).default([]),
  year: z.number().int().positive().optional(),
  rawMetadata: z.any().optional(),
});

export const RawProviderChapterSchema = z.object({
  id: z.string().min(1),
  number: z.number().nullable(),
  volume: z.number().int().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  language: z.string().min(1),
  displayNumber: z.string().optional(),
  pageCount: z.number().int().nonnegative().optional(),
  publishedAt: z.date().optional(),
  scanlatorGroups: z.array(z.string()).default([]),
  rawMetadata: z.any().optional(),
});

export const RawProviderPageSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().url().or(z.string().min(1)), // Support relative or invalid URLs temporarily if any
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  size: z.number().int().positive().optional(),
});
