"use client";

import { useState, useEffect, useCallback } from "react";
import type { Manga } from "@/types";

const STORAGE_KEY = "mangahub-recently-viewed";
const MAX_ITEMS = 20;

export function useRecentlyViewed() {
  const [items, setItems] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Manga[];
        setItems(parsed);
      }
    } catch (error) {
      console.error("Failed to load recently viewed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = useCallback((item: Manga) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeItem = useCallback((mangaId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== mangaId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    clearAll,
  };
}