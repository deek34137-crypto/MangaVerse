import { Metadata } from "next";
import { getMangaUrl, getChapterUrl, getSearchUrl } from "@/lib/url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mangahub.dpdns.org";

export interface GenerateSeoMetadataOptions {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Enterprise SEO & Canonical Metadata Generator (RFC-003 / Phase 0 Verification)
 * Generates unified, consistent head metadata across title, canonical link, OpenGraph, and Twitter cards.
 */
export function generateSeoMetadata({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
}: GenerateSeoMetadataOptions): Metadata {
  const fullCanonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;
  const fullImageUrl = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`
    : `${SITE_URL}/placeholders/cover.jpg`;

  return {
    title: `${title} | MangaHub`,
    description,
    alternates: {
      canonical: fullCanonicalUrl,
    },
    openGraph: {
      title: `${title} | MangaHub`,
      description,
      url: fullCanonicalUrl,
      siteName: "MangaHub",
      type: type as any,
      images: [
        {
          url: fullImageUrl,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | MangaHub`,
      description,
      images: [fullImageUrl],
    },
  };
}

/**
 * Generates JSON-LD Structured Data Graph for Manga/ComicSeries.
 */
export function generateMangaJsonLd(manga: {
  title: string;
  description: string;
  slug?: string;
  id: string;
  coverImage?: string;
  authors?: Array<{ name: string }>;
  status?: string;
}) {
  const mangaUrl = `${SITE_URL}${getMangaUrl(manga)}`;
  const imageUrl = manga.coverImage
    ? manga.coverImage.startsWith("http")
      ? manga.coverImage
      : `${SITE_URL}${manga.coverImage}`
    : `${SITE_URL}/placeholders/cover.jpg`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ComicSeries",
        "@id": mangaUrl,
        url: mangaUrl,
        name: manga.title,
        description: manga.description,
        image: imageUrl,
        ...(manga.authors?.length && {
          author: manga.authors.map((a) => ({
            "@type": "Person",
            name: a.name,
          })),
        }),
      },
      {
        "@type": "WebPage",
        "@id": mangaUrl,
        url: mangaUrl,
        name: manga.title,
        isPartOf: {
          "@type": "WebSite",
          "@id": SITE_URL,
          name: "MangaHub",
          url: SITE_URL,
        },
      },
    ],
  };
}
