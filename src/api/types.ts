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

export interface NavigationItem {
  title: string;
  subtitle?: string;
  uri: string;
  description?: string;
  thumbnailUri?: string;
  imageUri?: string;
  children?: NavigationItem[];
}

export interface GospelLibraryDynamicResponse {
  content?: {
    [key: string]: any;
  };
  toc?: NavigationItem[];
  pids?: string[];
  uri?: string;
  verified?: boolean;
  restricted?: boolean;
  error?: {
    message: string;
    code?: string;
  };
}

export interface StructureBrowseResult {
  uri: string;
  title: string;
  type: 'session' | 'book' | 'chapter' | 'section' | 'collection';
  description?: string;
  children?: StructureBrowseResult[];
  thumbnailUri?: string;
  metadata?: {
    speaker?: string;
    date?: string;
    timeframe?: string;
  };
}

export interface MediaContent {
  type: 'audio' | 'video' | 'image';
  url: string;
  format?: string;
  quality?: string;
  language?: string;
  duration?: string;
  size?: string;
  downloadUrl?: string;
}

export interface MediaResult {
  uri: string;
  title: string;
  description?: string;
  speaker?: string;
  date?: string;
  media: MediaContent[];
  thumbnailUrl?: string;
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