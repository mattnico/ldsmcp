import { GospelLibraryClient } from '../../api/client.js';

export interface SeminarySearchParams {
  query: string;
  lessonNumber?: number;
  subject?: 'old-testament' | 'new-testament' | 'book-of-mormon' | 'doctrine-and-covenants' | string;
  teacherManual?: boolean;
  studentManual?: boolean;
  start?: number;
  limit?: number;
}

export interface SeminarySearchResult {
  results: Array<{
    uri: string;
    title: string;
    snippet: string;
    link: string;
    contentType: 'seminary';
    metadata: {
      manual?: string;
      lessonNumber?: number;
      subject?: string;
      manualType?: 'teacher' | 'student' | 'both';
      displayLink?: string;
    };
  }>;
  pagination: {
    total: number;
    nextPageToken?: string;
    start: number;
  };
  searchType: 'seminary';
  error?: {
    message: string;
    code: string;
  };
}

export class SeminarySearch {
  private client: GospelLibraryClient;

  constructor(client: GospelLibraryClient) {
    this.client = client;
  }

  async searchSeminary(params: SeminarySearchParams): Promise<SeminarySearchResult> {
    try {
      // Build enhanced search query for seminary content
      let enhancedQuery = params.query;
      
      // Add seminary-specific terms to improve targeting
      if (!enhancedQuery.toLowerCase().includes('seminary') && !enhancedQuery.toLowerCase().includes('institute')) {
        enhancedQuery = `${enhancedQuery} seminary manual`;
      }
      
      // Add lesson number if specified
      if (params.lessonNumber) {
        enhancedQuery = `"lesson ${params.lessonNumber}" ${enhancedQuery}`;
      }
      
      // Add subject-specific terms
      if (params.subject) {
        const subjectTerms = this.getSubjectTerms(params.subject);
        enhancedQuery = `${enhancedQuery} ${subjectTerms}`;
      }
      
      // Build filter for seminary/institute manuals
      const filter = this.buildSeminaryFilter(params);
      
      const searchParams = new URLSearchParams({
        q: enhancedQuery,
        start: (params.start || 1).toString(),
        searchType: 'web',
        filter: filter,
        orderBy: '' // Relevance order
      });
      
      const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-search?${searchParams}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return {
          results: [],
          pagination: { total: 0, start: params.start || 1 },
          searchType: 'seminary',
          error: { message: `HTTP error! status: ${response.status}`, code: response.status.toString() }
        };
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return {
          results: [],
          pagination: { total: 0, start: params.start || 1 },
          searchType: 'seminary',
          error: { message: 'No seminary manual content found', code: 'NO_RESULTS' }
        };
      }

      return {
        results: data.results.map((result: any) => this.formatSeminaryResult(result, params)),
        pagination: { 
          total: data.totalSize || 0, 
          nextPageToken: data.nextPageToken, 
          start: params.start || 1 
        },
        searchType: 'seminary'
      };
      
    } catch (error: any) {
      return {
        results: [],
        pagination: { total: 0, start: params.start || 1 },
        searchType: 'seminary',
        error: { message: error.message, code: 'FETCH_ERROR' }
      };
    }
  }

  private buildSeminaryFilter(params: SeminarySearchParams): string {
    // Base filter for seminary/institute manuals
    let filter = 'siteSearch:"churchofjesuschrist.org/study/manual" AND (';
    
    // Seminary/Institute specific paths
    const seminaryPaths = [
      'siteSearch:"*seminary*"',
      'siteSearch:"*institute*"',
      'siteSearch:"*teacher-manual*"',
      'siteSearch:"*student-manual*"'
    ];
    
    // Add subject-specific manual paths if specified
    if (params.subject) {
      const subjectPaths = this.getSubjectManualPaths(params.subject);
      seminaryPaths.push(...subjectPaths);
    }
    
    filter += seminaryPaths.join(' OR ') + ')';
    
    // Standard exclusions
    filter += ' AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")';
    filter += ' AND -siteSearch:"*imageView=*"';
    filter += ' AND -siteSearch:"*adbid=*"';
    filter += ' AND -siteSearch:"*adbpl=*"';
    filter += ' AND -siteSearch:"*adbpr=*"';
    filter += ' AND -siteSearch:"*cid=*"';
    filter += ' AND -siteSearch:"*short_code=*"';
    
    return filter;
  }

  private getSubjectTerms(subject: string): string {
    const termMap: Record<string, string> = {
      'old-testament': '"Old Testament" Genesis Exodus Psalms Isaiah',
      'new-testament': '"New Testament" Matthew Mark Luke John Romans',
      'book-of-mormon': '"Book of Mormon" Nephi Alma Mosiah Helaman',
      'doctrine-and-covenants': '"Doctrine and Covenants" D&C revelation'
    };
    
    return termMap[subject] || subject.replace('-', ' ');
  }

  private getSubjectManualPaths(subject: string): string[] {
    const pathMap: Record<string, string[]> = {
      'old-testament': [
        'siteSearch:"*old-testament*"',
        'siteSearch:"*ot-*"'
      ],
      'new-testament': [
        'siteSearch:"*new-testament*"',
        'siteSearch:"*nt-*"'
      ],
      'book-of-mormon': [
        'siteSearch:"*book-of-mormon*"',
        'siteSearch:"*bofm*"'
      ],
      'doctrine-and-covenants': [
        'siteSearch:"*doctrine-and-covenants*"',
        'siteSearch:"*dc-*"',
        'siteSearch:"*d-c-*"'
      ]
    };
    
    return pathMap[subject] || [];
  }

  private formatSeminaryResult(result: any, params: SeminarySearchParams): any {
    const fields = result.document.derivedStructData.fields;
    const link = fields.link.stringValue;
    
    return {
      uri: this.extractUri(link),
      title: fields.title.stringValue,
      snippet: this.extractSnippet(fields.snippets),
      link: link,
      contentType: 'seminary',
      metadata: {
        manual: this.extractManualInfo(link),
        lessonNumber: this.extractLessonNumber(fields.title.stringValue),
        subject: params.subject || this.detectSubjectFromLink(link),
        manualType: this.detectManualType(link),
        displayLink: fields.displayLink?.stringValue
      }
    };
  }

  private extractManualInfo(url: string): string {
    const manualMatch = url.match(/\/manual\/([^\/]+)/);
    if (manualMatch) {
      return manualMatch[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Seminary Manual';
  }

  private extractLessonNumber(title: string): number | undefined {
    const lessonMatch = title.match(/lesson\s*(\d+)/i);
    return lessonMatch ? parseInt(lessonMatch[1]) : undefined;
  }

  private detectSubjectFromLink(url: string): string | undefined {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('old-testament') || lowerUrl.includes('ot-')) {
      return 'old-testament';
    }
    if (lowerUrl.includes('new-testament') || lowerUrl.includes('nt-')) {
      return 'new-testament';
    }
    if (lowerUrl.includes('book-of-mormon') || lowerUrl.includes('bofm')) {
      return 'book-of-mormon';
    }
    if (lowerUrl.includes('doctrine-and-covenants') || lowerUrl.includes('d-c-') || lowerUrl.includes('dc-')) {
      return 'doctrine-and-covenants';
    }
    
    return undefined;
  }

  private detectManualType(url: string): 'teacher' | 'student' | 'both' {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('teacher')) {
      return 'teacher';
    }
    if (lowerUrl.includes('student')) {
      return 'student';
    }
    
    return 'both'; // Default when type is unclear
  }

  private extractUri(url: string): string {
    // Convert full URL to URI path
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // If URL parsing fails, try to extract the path manually
      const match = url.match(/churchofjesuschrist\.org(\/[^?#]*)/);
      return match ? match[1] : url;
    }
  }

  private extractSnippet(snippets: any): string {
    if (!snippets || !snippets.listValue) {
      return 'No preview available';
    }
    
    const snippetList = snippets.listValue.values || [];
    if (snippetList.length === 0) {
      return 'No preview available';
    }
    
    // Get the first snippet
    const firstSnippet = snippetList[0];
    if (firstSnippet && firstSnippet.stringValue) {
      return firstSnippet.stringValue;
    }
    
    return 'No preview available';
  }
}