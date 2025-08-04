export interface GospelLibraryResponse {
  meta?: {
    title?: string;
    description?: string;
    url?: string;
    canonicalUrl?: string;
    publication?: string;
    contentType?: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    publicationDate?: string;
  };
  content?: {
    head?: string;
    body?: string;
    footnotes?: Array<{
      noteNumber: string;
      noteMarker: string;
      noteContent: string;
      noteRefs?: Array<{
        href: string;
        text: string;
      }>;
    }>;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface SearchResult {
  title: string;
  uri: string;
  snippet: string;
  type: string;
}

export interface ExploreResult {
  uri: string;
  title?: string;
  type?: string;
  success: boolean;
  error?: string;
}