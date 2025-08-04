// Search Intelligence Engine - Analyzes queries and routes to optimal endpoints

export interface SearchIntent {
  primaryEndpoint: string;
  confidence: number;
  suggestedParams: any;
  fallbackEndpoints: string[];
  reasoning: string;
}

export interface QueryAnalysis {
  contentType: 'conference' | 'scripture' | 'manual' | 'magazine' | 'media' | 'handbook' | 'mixed' | 'unknown';
  hasQuotes: boolean;
  hasDateTerms: boolean;
  hasSpeakerTerms: boolean;
  hasScriptureReferences: boolean;
  hasBookNames: boolean;
  suggestedFilters: any;
}

export class SearchIntelligence {
  
  // Scripture book patterns
  private static scriptureBooks = [
    'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
    'matthew', 'mark', 'luke', 'john', 'acts', 'romans',
    '1 nephi', '2 nephi', 'jacob', 'enos', 'jarom', 'omni', 'mosiah', 'alma', 'helaman', 'mormon', 'ether', 'moroni',
    'doctrine and covenants', 'd&c', 'pearl of great price', 'moses', 'abraham', 'joseph smith'
  ];

  // Conference speaker patterns  
  private static commonSpeakers = [
    'russell m nelson', 'russell m. nelson', 'dallin h oaks', 'dallin h. oaks', 
    'henry b eyring', 'henry b. eyring', 'jeffrey r holland', 'jeffrey r. holland',
    'dieter f uchtdorf', 'dieter f. uchtdorf', 'david a bednar', 'david a. bednar', 
    'quentin l cook', 'quentin l. cook', 'd todd christofferson', 'd. todd christofferson',
    'nelson', 'oaks', 'eyring', 'holland', 'uchtdorf', 'bednar', 'cook', 'christofferson',
    'president nelson', 'elder nelson', 'president oaks', 'elder oaks'
  ];

  // Manual/handbook terms
  private static manualTerms = [
    'come follow me', 'general handbook', 'for the strength of youth', 'handbook',
    'lesson', 'manual', 'curriculum', 'teaching', 'study guide'
  ];

  // Date terms
  private static dateTerms = [
    '2025', '2024', '2023', '2022', '2021', '2020', 
    'recent', 'latest', 'current', 'this year', 'last year',
    'april', 'october', 'conference'
  ];

  // Media terms
  private static mediaTerms = [
    'video', 'audio', 'music', 'hymn', 'song', 'image', 'picture', 'pdf'
  ];

  static analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    return {
      contentType: this.detectContentType(lowerQuery),
      hasQuotes: query.includes('"'),
      hasDateTerms: this.dateTerms.some(term => lowerQuery.includes(term)),
      hasSpeakerTerms: this.commonSpeakers.some(speaker => lowerQuery.includes(speaker)),
      hasScriptureReferences: this.hasScriptureReference(lowerQuery),
      hasBookNames: this.scriptureBooks.some(book => lowerQuery.includes(book)),
      suggestedFilters: this.suggestFilters(lowerQuery)
    };
  }

  static determineSearchIntent(query: string, options: any = {}): SearchIntent {
    const analysis = this.analyzeQuery(query);
    
    // Scripture-focused search
    if (analysis.contentType === 'scripture' || analysis.hasScriptureReferences || analysis.hasBookNames) {
      return {
        primaryEndpoint: 'search_scriptures',
        confidence: 0.9,
        suggestedParams: {
          query,
          collectionName: this.detectScriptureCollection(query),
          testament: this.detectTestament(query)
        },
        fallbackEndpoints: ['search_archive'],
        reasoning: 'Query contains scripture references, book names, or verse patterns'
      };
    }

    // Conference-focused search - use archive search for speaker queries as it's more reliable
    if (analysis.contentType === 'conference' || analysis.hasSpeakerTerms || 
        (analysis.hasDateTerms && (query.toLowerCase().includes('conference') || query.toLowerCase().includes('talk')))) {
      
      const speaker = this.detectSpeaker(query);
      const dateRange = this.detectDateRange(query);
      
      // If we have a specific speaker, use archive search with author filter (most reliable)
      if (speaker) {
        return {
          primaryEndpoint: 'search_archive',
          confidence: 0.9,
          suggestedParams: {
            query,
            source: 47, // General Conference
            author: this.normalizeAuthorSlug(speaker),
            dateRange: dateRange || 'past-12-months'
          },
          fallbackEndpoints: ['search_general_conference', 'search_vertex'],
          reasoning: 'Query mentions specific speaker - using archive search with author filter for best results'
        };
      } else {
        // General conference search for non-speaker specific queries
        return {
          primaryEndpoint: 'search_general_conference',
          confidence: 0.85,
          suggestedParams: {
            query,
            startYear: this.detectYearRange(query)?.start,
            endYear: this.detectYearRange(query)?.end
          },
          fallbackEndpoints: ['search_archive'],
          reasoning: 'Query mentions conference terms or conference-related dates'
        };
      }
    }

    // Manual/lesson content
    if (analysis.contentType === 'manual' || this.manualTerms.some(term => query.toLowerCase().includes(term))) {
      const manualType = this.detectManualType(query);
      
      if (manualType === 'come-follow-me') {
        return {
          primaryEndpoint: 'search_come_follow_me',
          confidence: 0.8,
          suggestedParams: { query },
          fallbackEndpoints: ['search_vertex', 'search_archive'],
          reasoning: 'Query specifically mentions Come, Follow Me content'
        };
      } else if (manualType === 'handbook') {
        return {
          primaryEndpoint: 'search_general_handbook',
          confidence: 0.8,
          suggestedParams: { query },
          fallbackEndpoints: ['search_vertex', 'search_archive'], 
          reasoning: 'Query mentions General Handbook or policy-related terms'
        };
      } else {
        return {
          primaryEndpoint: 'search_vertex',
          confidence: 0.7,
          suggestedParams: { 
            query,
            searchType: 'web',
            filter: 'siteSearch:"churchofjesuschrist.org/study/manual*"'
          },
          fallbackEndpoints: ['search_archive'],
          reasoning: 'Query mentions manual/lesson content'
        };
      }
    }

    // Media search
    if (analysis.contentType === 'media' || this.mediaTerms.some(term => query.toLowerCase().includes(term))) {
      const mediaType = this.detectMediaType(query);
      return {
        primaryEndpoint: 'search_vertex',
        confidence: 0.75,
        suggestedParams: {
          query,
          searchType: mediaType || 'web'
        },
        fallbackEndpoints: ['search_archive'],
        reasoning: `Query requests ${mediaType || 'media'} content`
      };
    }

    // Magazine content
    if (analysis.contentType === 'magazine' || this.isMagazineQuery(query)) {
      return {
        primaryEndpoint: 'search_magazines_archive',
        confidence: 0.7,
        suggestedParams: {
          query,
          dateRange: this.detectDateRange(query)
        },
        fallbackEndpoints: ['search_archive'],
        reasoning: 'Query mentions magazine names or magazine-related terms'
      };
    }

    // Default to comprehensive archive search
    return {
      primaryEndpoint: 'search_archive',
      confidence: 0.6,
      suggestedParams: {
        query,
        source: this.suggestArchiveSource(analysis)
      },
      fallbackEndpoints: ['search_vertex'],
      reasoning: 'General query - using comprehensive archive search'
    };
  }

  private static detectContentType(query: string): QueryAnalysis['contentType'] {
    // Conference speakers take priority - check first before scripture patterns
    if (this.commonSpeakers.some(speaker => query.includes(speaker))) {
      return 'conference';
    }
    
    // Conference-related terms
    if (query.includes('conference') || query.includes('talk') || query.includes('general conference')) {
      return 'conference';
    }
    
    // Scripture books and references (but only if no conference indicators)
    if (this.scriptureBooks.some(book => query.includes(book)) || this.hasScriptureReference(query)) {
      return 'scripture';
    }
    
    if (this.manualTerms.some(term => query.includes(term))) {
      return 'manual';
    }
    if (this.mediaTerms.some(term => query.includes(term))) {
      return 'media';
    }
    if (query.includes('liahona') || query.includes('friend') || query.includes('magazine')) {
      return 'magazine';
    }
    if (query.includes('handbook') || query.includes('policy') || query.includes('procedure')) {
      return 'handbook';
    }
    return 'unknown';
  }

  private static hasScriptureReference(query: string): boolean {
    // Check for patterns like "1 Nephi 3:7", "D&C 76", "John 3:16"
    const referencePatterns = [
      /\d+\s+nephi\s+\d+/i,
      /d&c\s+\d+/i,
      /\b(genesis|exodus|leviticus|numbers|deuteronomy|matthew|mark|luke|john|acts|romans|jacob|enos|jarom|omni|mosiah|alma|helaman|mormon|ether|moroni)\s+\d+:\d+/i,
      /\b(genesis|exodus|leviticus|numbers|deuteronomy|matthew|mark|luke|john|acts|romans|jacob|enos|jarom|omni|mosiah|alma|helaman|mormon|ether|moroni)\s+\d+\b/i,
      /doctrine\s+and\s+covenants\s+\d+/i
    ];
    return referencePatterns.some(pattern => pattern.test(query));
  }

  private static detectScriptureCollection(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('book of mormon') || ['nephi', 'alma', 'mosiah', 'helaman'].some(book => lowerQuery.includes(book))) {
      return 'The Book of Mormon';
    }
    if (lowerQuery.includes('doctrine and covenants') || lowerQuery.includes('d&c')) {
      return 'The Doctrine and Covenants';
    }
    if (['matthew', 'mark', 'luke', 'john', 'romans', 'genesis'].some(book => lowerQuery.includes(book))) {
      return 'The Holy Bible';
    }
    if (lowerQuery.includes('pearl of great price') || ['moses', 'abraham'].some(book => lowerQuery.includes(book))) {
      return 'The Pearl of Great Price';
    }
    return undefined;
  }

  private static detectTestament(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();
    const oldTestamentBooks = ['genesis', 'exodus', 'psalms', 'isaiah', 'jeremiah'];
    const newTestamentBooks = ['matthew', 'mark', 'luke', 'john', 'romans', 'revelation'];
    
    if (oldTestamentBooks.some(book => lowerQuery.includes(book))) {
      return 'Old Testament';
    }
    if (newTestamentBooks.some(book => lowerQuery.includes(book))) {
      return 'New Testament';
    }
    return undefined;
  }

  private static detectSpeaker(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();
    for (const speaker of this.commonSpeakers) {
      if (lowerQuery.includes(speaker)) {
        return speaker;
      }
    }
    return undefined;
  }

  private static normalizeAuthorSlug(speaker: string): string {
    // Convert speaker name to URL slug format used by Gospel Library
    return speaker
      .toLowerCase()
      .replace(/\./g, '') // Remove periods
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();
  }

  private static detectYearRange(query: string): {start: number, end: number} | undefined {
    const currentYear = new Date().getFullYear();
    const lowerQuery = query.toLowerCase();
    
    // Look for specific years
    const yearMatch = query.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return { start: year, end: year };
    }
    
    // Look for relative terms
    if (lowerQuery.includes('recent') || lowerQuery.includes('latest') || lowerQuery.includes('current')) {
      return { start: currentYear - 2, end: currentYear };
    }
    if (lowerQuery.includes('last year')) {
      return { start: currentYear - 1, end: currentYear - 1 };
    }
    if (lowerQuery.includes('this year')) {
      return { start: currentYear, end: currentYear };
    }
    
    return undefined;
  }

  private static detectManualType(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('come follow me') || lowerQuery.includes('come, follow me')) {
      return 'come-follow-me';
    }
    if (lowerQuery.includes('general handbook') || lowerQuery.includes('handbook')) {
      return 'handbook';
    }
    if (lowerQuery.includes('for the strength of youth')) {
      return 'ftsoy';
    }
    return undefined;
  }

  private static detectMediaType(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('video')) return 'video';
    if (lowerQuery.includes('audio') || lowerQuery.includes('music') || lowerQuery.includes('hymn')) return 'music';
    if (lowerQuery.includes('image') || lowerQuery.includes('picture')) return 'image';
    if (lowerQuery.includes('pdf')) return 'pdf';
    return undefined;
  }

  private static isMagazineQuery(query: string): boolean {
    const magazineTerms = ['liahona', 'friend', 'ensign', 'magazine', 'article'];
    return magazineTerms.some(term => query.toLowerCase().includes(term));
  }

  private static detectDateRange(query: string): string | undefined {
    const lowerQuery = query.toLowerCase();
    
    // Check for specific years first
    const currentYear = new Date().getFullYear();
    if (lowerQuery.includes('2025') || lowerQuery.includes(String(currentYear))) {
      return 'past-6-months'; // Current year content
    }
    if (lowerQuery.includes('2024')) {
      return 'past-12-months';
    }
    if (lowerQuery.includes('2023')) {
      return 'past-5-years';
    }
    
    // Relative terms
    if (lowerQuery.includes('recent') || lowerQuery.includes('latest') || lowerQuery.includes('current')) {
      return 'past-12-months';
    }
    if (lowerQuery.includes('last conference') || lowerQuery.includes('previous conference')) {
      return 'past-6-months';
    }
    if (lowerQuery.includes('last year')) return 'past-12-months';
    if (lowerQuery.includes('past year')) return 'past-12-months';
    if (lowerQuery.includes('past 5 years')) return 'past-5-years';
    if (lowerQuery.includes('past 10 years')) return 'past-10-years';
    
    return undefined;
  }

  private static suggestArchiveSource(analysis: QueryAnalysis): number | undefined {
    switch (analysis.contentType) {
      case 'conference': return 47; // General Conference
      case 'scripture': return 48; // Scriptures
      case 'magazine': return 46; // Magazines
      case 'media': return 44; // Media
      case 'handbook': return 43; // Callings
      case 'manual': return 45; // Other
      default: return undefined; // All collections
    }
  }

  private static suggestFilters(query: string): any {
    const filters: any = {};
    
    // Year detection
    const yearMatch = query.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      filters.year = parseInt(yearMatch[1]);
    }
    
    // Speaker detection
    const speaker = this.detectSpeaker(query);
    if (speaker) {
      filters.speaker = speaker;
    }
    
    return filters;
  }

  // Method to get search suggestions based on failed queries
  static getSearchSuggestions(query: string, analysis: QueryAnalysis): string[] {
    const suggestions: string[] = [];
    
    if (analysis.hasQuotes) {
      suggestions.push('Try removing quotes for broader search results');
    } else {
      suggestions.push('Use quotes around phrases for exact matches');
    }
    
    if (analysis.contentType === 'unknown') {
      suggestions.push('Try adding specific terms like "conference", "scripture", or "manual"');
      suggestions.push('Consider searching in specific collections using specialized tools');
    }
    
    if (!analysis.hasDateTerms && (analysis.contentType === 'conference' || analysis.contentType === 'magazine')) {
      suggestions.push('Add date terms like "recent", "2024", or "past 5 years" to narrow results');
    }
    
    return suggestions;
  }
}