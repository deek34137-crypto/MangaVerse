"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContinueReadingItem } from "@/services/home";

const STORAGE_KEY = "mangahub-continue-reading";
const MAX_ITEMS = 25;

export function useContinueReading() {
  const [items, setItems] = useState<ContinueReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ContinueReadingItem[];
        setItems(parsed);
      }
    } catch (error) {
      console.error("Failed to load continue reading:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = useCallback((item: ContinueReadingItem) => {
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

  const syncWithServer = useCallback(async (serverItems: ContinueReadingItem[]) => {
    const localData = localStorage.getItem(STORAGE_KEY);
    let localItems: ContinueReadingItem[] = [];
    
    if (localData) {
      try {
        localItems = JSON.parse(localData);
      } catch {
        localItems = [];
      }
    }

    // Merge: newest readAt wins for each manga
    const merged = new Map<string, ContinueReadingItem>();
    
    for (const item of [...localItems, ...serverItems]) {
      const existing = merged.get(item.id);
      if (!existing || new Date(item.readAt) > new Date(existing.readAt)) {
        merged.set(item.id, item);
      }
    }

    const mergedArray = Array.from(merged.values())
      .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())
      .slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedArray));
    setItems(mergedArray);
  }, []);

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    clearAll,
    syncWithServer,
  };
}