export interface MangaRelation {
  id: string;
  relationType: string;
  title: string;
  coverImage?: string;
  type?: string;
  status?: string;
  rating?: number;
}

export interface EnrichedMetadata {
  sourceId: string;
  sourceName: string;
  title: string;
  altTitles: string[];
  description?: string;
  coverImage?: string;
  bannerImage?: string;
  status?: string;
  type?: string;
  genres: string[];
  tags: string[];
  authors: string[];
  artists: string[];
  rating?: number;
  startDate?: string;
  endDate?: string;
  popularity?: number;
  relations?: MangaRelation[];
}

export interface MetadataSource {
  readonly name: string;
  searchMetadata(query: string): Promise<EnrichedMetadata[]>;
  getMetadataById(id: string): Promise<EnrichedMetadata | null>;
}
