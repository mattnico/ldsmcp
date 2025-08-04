import fetch from 'node-fetch';
import { GospelLibraryResponse, GospelLibraryDynamicResponse, NavigationItem, StructureBrowseResult, MediaContent, MediaResult } from './types.js';

const BASE_URL_CONTENT = 'https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content';
const BASE_URL_DYNAMIC = 'https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/dynamic';
const DEFAULT_LANG = 'eng';

export class GospelLibraryClient {
  private baseUrlContent: string;
  private baseUrlDynamic: string;
  private defaultLang: string;

  constructor(
    baseUrlContent: string = BASE_URL_CONTENT, 
    baseUrlDynamic: string = BASE_URL_DYNAMIC,
    defaultLang: string = DEFAULT_LANG
  ) {
    this.baseUrlContent = baseUrlContent;
    this.baseUrlDynamic = baseUrlDynamic;
    this.defaultLang = defaultLang;
  }

  private validateUri(uri: string): boolean {
    // Validate URI format and length
    return /^\/[a-zA-Z0-9\-_\/]+$/.test(uri) && uri.length < 500;
  }

  async fetchContent(uri: string, lang?: string): Promise<GospelLibraryResponse> {
    if (!this.validateUri(uri)) {
      return {
        error: {
          message: 'Invalid URI format. URI must start with / and contain only alphanumeric characters, hyphens, underscores, and slashes.',
          code: 'INVALID_URI',
        },
      };
    }

    const language = lang || this.defaultLang;
    const url = `${this.baseUrlContent}?lang=${language}&uri=${encodeURIComponent(uri)}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        return {
          error: {
            message: `HTTP error! status: ${response.status}`,
            code: response.status.toString(),
          },
        };
      }

      const data = await response.json() as GospelLibraryResponse;
      return data;
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'FETCH_ERROR',
        },
      };
    }
  }

  async fetchDynamic(uri: string, lang?: string): Promise<GospelLibraryDynamicResponse> {
    if (!this.validateUri(uri)) {
      return {
        error: {
          message: 'Invalid URI format. URI must start with / and contain only alphanumeric characters, hyphens, underscores, and slashes.',
          code: 'INVALID_URI',
        },
      };
    }

    const language = lang || this.defaultLang;
    const url = `${this.baseUrlDynamic}?lang=${language}&uri=${encodeURIComponent(uri)}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        return {
          error: {
            message: `HTTP error! status: ${response.status}`,
            code: response.status.toString(),
          },
        };
      }

      const data = await response.json() as GospelLibraryDynamicResponse;
      return data;
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'FETCH_ERROR',
        },
      };
    }
  }

  async probeEndpoint(uri: string): Promise<boolean> {
    const response = await this.fetchContent(uri);
    return !response.error && !!response.content;
  }

  parseDynamicContent(dynamicResponse: GospelLibraryDynamicResponse): StructureBrowseResult[] {
    const results: StructureBrowseResult[] = [];
    
    if (!dynamicResponse.content) return results;
    
    // Parse different content structures
    for (const [key, value] of Object.entries(dynamicResponse.content)) {
      if (Array.isArray(value)) {
        // Handle arrays of items (like conference sessions)
        value.forEach((item: any) => {
          if (item.title && item.uri) {
            results.push({
              uri: item.uri,
              title: item.title,
              type: this.inferContentType(item.uri),
              description: item.description || item.subtitle,
              thumbnailUri: item.imageUri || item.thumbnailUri,
              metadata: {
                speaker: item.subtitle,
                date: item.date,
              },
            });
          }
        });
      } else if (value && typeof value === 'object' && value.title) {
        // Handle single objects
        results.push({
          uri: value.uri || key,
          title: value.title,
          type: this.inferContentType(value.uri || key),
          description: value.description,
          thumbnailUri: value.imageUri || value.thumbnailUri,
        });
      }
    }
    
    return results;
  }

  private inferContentType(uri: string): StructureBrowseResult['type'] {
    if (uri.includes('/general-conference/')) {
      return uri.split('/').length > 4 ? 'session' : 'collection';
    }
    if (uri.includes('/scriptures/')) {
      const parts = uri.split('/');
      if (parts.length === 3) return 'book';
      if (parts.length === 4) return 'chapter';
      return 'section';
    }
    if (uri.includes('/manual/')) return 'book';
    return 'collection';
  }

  parseHtmlContent(html: string): string {
    const textWithoutTags = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textWithoutTags;
  }

  extractSnippet(content: string, maxLength: number = 200): string {
    const cleanText = this.parseHtmlContent(content);
    if (cleanText.length <= maxLength) {
      return cleanText;
    }
    return cleanText.substring(0, maxLength) + '...';
  }

  extractMediaFromResponse(response: GospelLibraryResponse): MediaContent[] {
    const media: MediaContent[] = [];
    
    if (!response.meta) return media;

    // Extract audio URLs
    if (response.meta.audioUrl) {
      media.push({
        type: 'audio',
        url: response.meta.audioUrl,
        format: this.extractFormatFromUrl(response.meta.audioUrl),
      });
    }

    // Extract video URLs
    if (response.meta.videoUrl) {
      media.push({
        type: 'video',
        url: response.meta.videoUrl,
        format: this.extractFormatFromUrl(response.meta.videoUrl),
      });
    }

    // Extract image URLs
    if (response.meta.imageUrl) {
      media.push({
        type: 'image',
        url: response.meta.imageUrl,
        format: this.extractFormatFromUrl(response.meta.imageUrl),
      });
    }

    return media;
  }

  extractMediaFromHTML(htmlContent: string): MediaContent[] {
    const media: MediaContent[] = [];
    
    // Extract video sources from HTML
    const videoMatches = htmlContent.match(/<video[^>]*>[\s\S]*?<\/video>/gi);
    if (videoMatches) {
      videoMatches.forEach(videoTag => {
        const srcMatch = videoTag.match(/src="([^"]+)"/i);
        if (srcMatch) {
          const parsedAsset = this.parseAssetUrl(srcMatch[1]);
          media.push({
            type: 'video',
            url: srcMatch[1],
            format: parsedAsset.format,
            quality: parsedAsset.quality,
            language: parsedAsset.language,
            downloadUrl: parsedAsset.downloadUrl,
          });
        }
      });
    }

    // Extract audio sources from HTML
    const audioMatches = htmlContent.match(/<audio[^>]*>[\s\S]*?<\/audio>/gi);
    if (audioMatches) {
      audioMatches.forEach(audioTag => {
        const srcMatch = audioTag.match(/src="([^"]+)"/i);
        if (srcMatch) {
          const parsedAsset = this.parseAssetUrl(srcMatch[1]);
          media.push({
            type: 'audio',
            url: srcMatch[1],
            format: parsedAsset.format,
            quality: parsedAsset.quality,
            language: parsedAsset.language,
            downloadUrl: parsedAsset.downloadUrl,
          });
        }
      });
    }

    // Extract embedded media URLs from data attributes
    const dataMediaMatches = htmlContent.match(/data-media-url="([^"]+)"/gi);
    if (dataMediaMatches) {
      dataMediaMatches.forEach(match => {
        const urlMatch = match.match(/data-media-url="([^"]+)"/i);
        if (urlMatch) {
          const url = urlMatch[1];
          const parsedAsset = this.parseAssetUrl(url);
          media.push({
            type: this.inferMediaType(url),
            url: url,
            format: parsedAsset.format,
            quality: parsedAsset.quality,
            language: parsedAsset.language,
            downloadUrl: parsedAsset.downloadUrl,
          });
        }
      });
    }

    // Extract direct asset URLs from text content
    const assetUrlMatches = htmlContent.match(/https:\/\/assets\.churchofjesuschrist\.org\/[a-zA-Z0-9]+(?:-(?:\d+p|\d+k))?-[a-z]{2,3}\.(?:mp4|m3u8|mp3)/gi);
    if (assetUrlMatches) {
      assetUrlMatches.forEach(url => {
        const parsedAsset = this.parseAssetUrl(url);
        media.push({
          type: this.inferMediaType(url),
          url: url,
          format: parsedAsset.format,
          quality: parsedAsset.quality,
          language: parsedAsset.language,
          downloadUrl: parsedAsset.downloadUrl,
        });
      });
    }

    return media;
  }

  extractAssetsFromJSON(response: any): MediaContent[] {
    const media: MediaContent[] = [];
    const jsonString = JSON.stringify(response);
    
    // Find all asset URLs in the entire JSON response
    const assetUrlMatches = jsonString.match(/https:\/\/assets\.churchofjesuschrist\.org\/[a-zA-Z0-9]+(?:-(?:\d+p|\d+k))?-[a-z]{2,3}\.(?:mp4|m3u8|mp3|jpg|png|jpeg|webp)/gi);
    let allUrls: string[] = [];
    
    // Add found URLs to our collection
    if (assetUrlMatches) {
      allUrls.push(...assetUrlMatches);
    }
    
    // Also look for asset IDs in data attributes and construct URLs
    const dataAssetMatches = jsonString.match(/data-(?:assetId|ref-id)[^"]*"([a-zA-Z0-9]+)"/gi);
    if (dataAssetMatches) {
      dataAssetMatches.forEach(match => {
        const idMatch = match.match(/data-(?:assetId|ref-id)[^"]*"([a-zA-Z0-9]+)"/i);
        if (idMatch) {
          const assetId = idMatch[1];
          // Generate common video formats for this asset ID
          const commonFormats = [
            `https://assets.churchofjesuschrist.org/${assetId}-1080p-en.mp4`,
            `https://assets.churchofjesuschrist.org/${assetId}-720p-en.mp4`,
            `https://assets.churchofjesuschrist.org/${assetId}-360p-en.mp4`,
          ];
          allUrls.push(...commonFormats);
        }
      });
    }
    
    if (allUrls.length > 0) {
      // Deduplicate URLs
      const uniqueUrls = [...new Set(allUrls)];
      
      uniqueUrls.forEach(url => {
        const parsedAsset = this.parseAssetUrl(url);
        media.push({
          type: this.inferMediaType(url),
          url: url,
          format: parsedAsset.format,
          quality: parsedAsset.quality,
          language: parsedAsset.language,
          downloadUrl: parsedAsset.downloadUrl,
        });
      });

      // Extract asset IDs from existing URLs and generate missing quality variants
      const existingAssetIds = new Set<string>();
      
      // Get asset IDs from URLs we already found
      uniqueUrls.forEach((url: string) => {
        const assetIdMatch = url.match(/assets\.churchofjesuschrist\.org\/([a-zA-Z0-9]+)-/);
        if (assetIdMatch) {
          existingAssetIds.add(assetIdMatch[1]);
        }
      });
      
      // Generate variants only for confirmed asset IDs
      existingAssetIds.forEach(assetId => {
        const variants = this.generateAssetVariants(assetId);
        // Filter out variants that we already have
        const newVariants = variants.filter(variant => 
          !uniqueUrls.includes(variant.url)
        );
        media.push(...newVariants);
      });
    }

    return media;
  }

  generateAssetVariants(assetId: string): MediaContent[] {
    const media: MediaContent[] = [];
    const videoQualities = ['1080p', '720p', '360p'];
    const audioQualities = ['128k', '64k'];
    const languages = ['en']; // Can be extended for other languages
    const formats = [
      { ext: 'mp4', type: 'video' as const, qualities: videoQualities },
      { ext: 'm3u8', type: 'video' as const, qualities: videoQualities },
      { ext: 'mp3', type: 'audio' as const, qualities: audioQualities },
    ];

    languages.forEach(lang => {
      formats.forEach(format => {
        format.qualities.forEach(quality => {
          const url = `https://assets.churchofjesuschrist.org/${assetId}-${quality}-${lang}.${format.ext}`;
          const downloadUrl = (format.ext === 'mp4' || format.ext === 'mp3') ? `${url}?download=true` : undefined;
          
          media.push({
            type: format.type,
            url: url,
            format: format.ext.toUpperCase(),
            quality: quality,
            language: lang,
            downloadUrl: downloadUrl,
          });
        });
      });
    });

    return media;
  }

  parseAssetUrl(url: string): {
    format: string;
    quality?: string;
    language?: string;
    downloadUrl?: string;
  } {
    const format = this.extractFormatFromUrl(url);
    
    // Extract quality (e.g., 1080p, 720p, 360p for video; 128k, 64k for audio)
    const qualityMatch = url.match(/-(\d+(?:p|k))-/);
    const quality = qualityMatch ? qualityMatch[1] : undefined;
    
    // Extract language (e.g., en, spa, fra)
    const languageMatch = url.match(/-([a-z]{2,3})\.(?:mp4|m3u8|mp3)/i);
    const language = languageMatch ? languageMatch[1] : undefined;
    
    // Generate download URL for MP4s
    const downloadUrl = format.toLowerCase() === 'mp4' && !url.includes('?download=true') 
      ? `${url}?download=true` 
      : undefined;

    return {
      format: format.toUpperCase(),
      quality,
      language,
      downloadUrl,
    };
  }

  async fetchMediaInfo(uri: string, lang?: string): Promise<MediaResult | null> {
    const response = await this.fetchContent(uri, lang);
    
    if (response.error || !response.meta) {
      return null;
    }

    // Extract media from multiple sources
    const metaMedia = this.extractMediaFromResponse(response);
    const htmlMedia = response.content?.body ? this.extractMediaFromHTML(response.content.body) : [];
    const jsonMedia = this.extractAssetsFromJSON(response);
    
    // Combine and deduplicate media
    const allMedia = [...metaMedia, ...htmlMedia, ...jsonMedia];
    const uniqueMedia = allMedia.filter((media, index, array) =>
      index === array.findIndex(m => m.url === media.url)
    );

    if (uniqueMedia.length === 0) {
      return null;
    }

    // Extract speaker from content or metadata
    let speaker = response.meta.publication;
    if (response.content?.body) {
      const speakerMatch = response.content.body.match(/By\s+([^<\n]+)/i);
      if (speakerMatch) {
        speaker = speakerMatch[1].trim();
      }
    }

    return {
      uri,
      title: response.meta.title || 'Untitled',
      description: response.meta.description,
      speaker,
      date: response.meta.publicationDate,
      media: uniqueMedia,
      thumbnailUrl: response.meta.imageUrl,
    };
  }

  private extractFormatFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  private inferMediaType(url: string): MediaContent['type'] {
    const extension = this.extractFormatFromUrl(url);
    
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension)) {
      return 'audio';
    }
    if (['mp4', 'webm', 'avi', 'mov', 'm4v'].includes(extension)) {
      return 'video';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    
    // Default based on URL patterns
    if (url.includes('audio') || url.includes('mp3')) return 'audio';
    if (url.includes('video') || url.includes('mp4')) return 'video';
    
    return 'image'; // Default fallback
  }
}

export const gospelLibraryClient = new GospelLibraryClient();