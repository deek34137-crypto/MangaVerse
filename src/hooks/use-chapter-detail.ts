"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Maximum chapters kept in client memory (LRU eviction)
const MAX_CACHE_SIZE = 20;

// In-memory client-side chapter cache
const chapterCache = new Map<string, any>();

// In-flight Promise deduplication map to prevent duplicate concurrent network requests
const pendingPromises = new Map<string, Promise<any>>();

function setInCache(key: string, value: any) {
  if (chapterCache.has(key)) {
    chapterCache.delete(key);
  } else if (chapterCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = chapterCache.keys().next().value;
    if (oldestKey) chapterCache.delete(oldestKey);
  }
  chapterCache.set(key, value);
}

export function useChapterDetail(
  mangaId: string,
  chapterId: string | null,
  enabled: boolean = true
) {
  const [chapter, setChapter] = useState<any | null>(() => {
    return chapterId ? chapterCache.get(`${mangaId}:${chapterId}`) || null : null;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hoverTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchChapter = useCallback(
    async (cid: string, force: boolean = false) => {
      const cacheKey = `${mangaId}:${cid}`;

      if (!force && chapterCache.has(cacheKey)) {
        const cached = chapterCache.get(cacheKey);
        setChapter(cached);
        setLoading(false);
        setError(null);
        return cached;
      }

      // If already fetching in-flight, reuse existing Promise (deduplication)
      if (pendingPromises.has(cacheKey)) {
        setLoading(true);
        setError(null);
        try {
          const data = await pendingPromises.get(cacheKey)!;
          setChapter(data);
          setLoading(false);
          return data;
        } catch (err: any) {
          setError(err.message || "Failed to load chapter");
          setLoading(false);
          return null;
        }
      }

      setLoading(true);
      setError(null);

      const promise = (async () => {
        try {
          const res = await fetch(`/api/manga/${mangaId}/chapters/${cid}`);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} - ${res.statusText}`);
          }
          const data = await res.json();
          if (data.error) {
            throw new Error(data.error);
          }

          setInCache(cacheKey, data);
          return data;
        } finally {
          pendingPromises.delete(cacheKey);
        }
      })();

      pendingPromises.set(cacheKey, promise);

      try {
        const data = await promise;
        setChapter(data);
        setLoading(false);
        return data;
      } catch (err: any) {
        console.error(`[useChapterDetail] Error fetching chapter ${cid}:`, err);
        setError(err.message || "Failed to load chapter");
        setLoading(false);
        return null;
      }
    },
    [mangaId]
  );

  useEffect(() => {
    if (enabled && chapterId) {
      fetchChapter(chapterId);
    } else if (!chapterId) {
      setChapter(null);
      setLoading(false);
    }
  }, [mangaId, chapterId, enabled, fetchChapter]);

  // Debounced background prefetch helper (200ms delay to avoid hover spam)
  const prefetchChapter = useCallback(
    (nextChapterId: string, debounceMs: number = 200) => {
      if (!nextChapterId) return;
      const cacheKey = `${mangaId}:${nextChapterId}`;

      if (chapterCache.has(cacheKey) || pendingPromises.has(cacheKey)) return;

      if (hoverTimers.current.has(cacheKey)) {
        clearTimeout(hoverTimers.current.get(cacheKey)!);
      }

      const timer = setTimeout(() => {
        hoverTimers.current.delete(cacheKey);
        if (chapterCache.has(cacheKey) || pendingPromises.has(cacheKey)) return;

        const promise = fetch(`/api/manga/${mangaId}/chapters/${nextChapterId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && !data.error) {
              setInCache(cacheKey, data);
              console.log(`[useChapterDetail] Prefetched chapter ${nextChapterId} for manga ${mangaId}`);
            }
            return data;
          })
          .catch(() => null)
          .finally(() => {
            pendingPromises.delete(cacheKey);
          });

        pendingPromises.set(cacheKey, promise);
      }, debounceMs);

      hoverTimers.current.set(cacheKey, timer);
    },
    [mangaId]
  );

  const retry = useCallback(() => {
    if (chapterId) {
      fetchChapter(chapterId, true);
    }
  }, [chapterId, fetchChapter]);

  return {
    chapter,
    loading,
    error,
    retry,
    prefetchChapter,
  };
}
