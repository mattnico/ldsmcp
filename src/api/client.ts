import fetch from 'node-fetch';
import { GospelLibraryResponse } from './types.js';

const BASE_URL = 'https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content';
const DEFAULT_LANG = 'eng';

export class GospelLibraryClient {
  private baseUrl: string;
  private defaultLang: string;

  constructor(baseUrl: string = BASE_URL, defaultLang: string = DEFAULT_LANG) {
    this.baseUrl = baseUrl;
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
    const url = `${this.baseUrl}?lang=${language}&uri=${encodeURIComponent(uri)}`;

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

  async probeEndpoint(uri: string): Promise<boolean> {
    const response = await this.fetchContent(uri);
    return !response.error && !!response.content;
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
}

export const gospelLibraryClient = new GospelLibraryClient();