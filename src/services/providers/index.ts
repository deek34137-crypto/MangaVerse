import { providerRegistry } from "./registry";
import { MangaDexProvider } from "./mangadex";
import { ComicKProvider } from "./comick";
import { WeebCentralProvider } from "./weebcentral/provider";
import { MangaKatanaProvider } from "./mangakatana/provider";
import { WebtoonProvider } from "./webtoon/provider";

// Register providers with their factories for lazy loading
providerRegistry.register("mangadex",    () => new MangaDexProvider());
providerRegistry.register("comick",      () => new ComicKProvider());
providerRegistry.register("weebcentral", () => new WeebCentralProvider());
providerRegistry.register("mangakatana", () => new MangaKatanaProvider());
providerRegistry.register("webtoon",     () => new WebtoonProvider());


// Export types and registry
export * from "./types";
export * from "./transport";
export * from "./registry";
export { providerRegistry };
export default providerRegistry;
