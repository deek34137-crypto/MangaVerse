export interface ProviderBadgeInfo {
  id: string;
  name: string;
  isOnline: boolean;
  colorClass: string;
}

export function getProviderBadgeInfo(providerId: string, isOnline: boolean = true): ProviderBadgeInfo {
  const normalized = providerId.toLowerCase();
  switch (normalized) {
    case "mangadex":
      return { id: normalized, name: "MangaDex", isOnline, colorClass: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
    case "comick":
      return { id: normalized, name: "ComicK", isOnline, colorClass: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" };
    case "weebcentral":
      return { id: normalized, name: "WeebCentral", isOnline, colorClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    case "mangakatana":
      return { id: normalized, name: "MangaKatana", isOnline, colorClass: "bg-rose-500/20 text-rose-400 border-rose-500/30" };
    default:
      return { id: normalized, name: providerId, isOnline, colorClass: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
  }
}
