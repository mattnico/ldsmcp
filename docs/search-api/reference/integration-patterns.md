# Integration Patterns

Common patterns and best practices for integrating Gospel Library search endpoints into applications.

## Client Architecture

### Gospel Library Client Class
```javascript
class GospelLibraryClient {
  constructor(options = {}) {
    this.defaultLang = options.lang || 'eng';
    this.baseUrl = 'https://www.churchofjesuschrist.org';
    this.timeout = options.timeout || 10000;
  }

  // Core search methods
  async searchVertexAI(query, options = {}) { /* Implementation */ }
  async searchGeneralConference(query, options = {}) { /* Implementation */ }
  async searchScriptures(query, options = {}) { /* Implementation */ }
  async fetchScriptureBooks(lang = 'eng') { /* Implementation */ }
  async fetchSearchStrings(lang = 'eng') { /* Implementation */ }
  async fetchVideoMetadata(videoUrl) { /* Implementation */ }

  // Utility methods
  extractUriFromLink(link) { /* Implementation */ }
  extractSnippet(snippetsField) { /* Implementation */ }
}
```

### Error Handling Pattern
```javascript
// Consistent error response structure
function createErrorResponse(message, code = 'UNKNOWN_ERROR', details = null) {
  return {
    error: {
      message,
      code,
      details
    }
  };
}

// Standard try-catch wrapper
async function withErrorHandling(operation, fallback = null) {
  try {
    const result = await operation();
    
    if (!result.ok && result.status) {
      return createErrorResponse(
        `HTTP error: ${result.status}`,
        `HTTP_${result.status}`
      );
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    
    if (fallback && typeof fallback === 'function') {
      return await fallback();
    }
    
    return createErrorResponse(
      error.message || 'Unknown error occurred',
      'FETCH_ERROR',
      { originalError: error.toString() }
    );
  }
}
```

## MCP Integration Patterns

### Tool Handler Template
```javascript
// Standard MCP tool handler pattern
async function handleSearchTool(args, messageId, searchFunction) {
  const { query, limit = 20, offset = 0, ...otherArgs } = args;
  
  try {
    const searchResponse = await searchFunction(query, {
      start: offset,
      limit,
      ...otherArgs
    });
    
    if (searchResponse.error) {
      return sendErrorMessage(messageId, searchResponse.error.message);
    }

    const resultText = formatSearchResults(query, searchResponse, limit);
    
    sendMessage({
      jsonrpc: "2.0",
      id: messageId,
      result: {
        content: [{
          type: "text",
          text: resultText
        }]
      }
    });
  } catch (error) {
    sendErrorMessage(messageId, error.message);
  }
}

// Utility functions
function sendErrorMessage(messageId, errorMessage) {
  sendMessage({
    jsonrpc: "2.0",
    id: messageId,
    result: {
      content: [{
        type: "text",
        text: `Error: ${errorMessage}`
      }]
    }
  });
}

function formatSearchResults(query, searchResponse, limit) {
  let resultText = `# Search Results for "${query}"\n\n`;
  resultText += `Found ${searchResponse.pagination?.total || searchResponse.results.length} total results:\n\n`;

  searchResponse.results.slice(0, limit).forEach((result, index) => {
    resultText += `## ${index + 1}. ${result.title}\n`;
    resultText += `**URI:** ${result.uri}\n`;
    if (result.snippet) {
      resultText += `**Snippet:** ${result.snippet}\n`;
    }
    resultText += `\n`;
  });
  
  return resultText;
}
```

### Tool Schema Pattern
```javascript
// Standard tool schema structure
function createSearchToolSchema(name, description, additionalProperties = {}) {
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query text"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 20)",
          default: 20
        },
        offset: {
          type: "number",
          description: "Starting offset for pagination (default: 0)",
          default: 0
        },
        ...additionalProperties
      },
      required: ["query"]
    }
  };
}

// Usage examples
const generalConferenceSchema = createSearchToolSchema(
  "search_general_conference",
  "Search within General Conference talks",
  {
    dateRange: {
      type: "object",
      description: "Date range filter",
      properties: {
        startYear: { type: "number" },
        endYear: { type: "number" }
      }
    }
  }
);
```

## Caching Strategies

### Memory Cache Implementation
```javascript
class MemoryCache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
}

// Usage in client
class CachedGospelLibraryClient extends GospelLibraryClient {
  constructor(options = {}) {
    super(options);
    this.cache = new MemoryCache(options.cacheTtl);
  }
  
  async searchWithCache(searchFunction, cacheKey, ...args) {
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const result = await searchFunction.apply(this, args);
    
    if (!result.error) {
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }
  
  async searchScriptures(query, options = {}) {
    const cacheKey = `scriptures:${query}:${JSON.stringify(options)}`;
    return this.searchWithCache(super.searchScriptures, cacheKey, query, options);
  }
}
```

### Cache Key Generation
```javascript
// Generate consistent cache keys
function generateCacheKey(endpoint, query, options = {}) {
  const optionsKey = Object.keys(options)
    .sort()
    .map(key => `${key}:${options[key]}`)
    .join('|');
    
  return `${endpoint}:${query}:${optionsKey}`;
}

// Example usage
const key = generateCacheKey('scripture-search', 'faith', {
  collectionName: 'The Book of Mormon',
  limit: 20
});
// Result: "scripture-search:faith:collectionName:The Book of Mormon|limit:20"
```

## Pagination Patterns

### Cursor-Based Pagination
```javascript
class PaginatedSearchResults {
  constructor(client, searchFunction, query, options = {}) {
    this.client = client;
    this.searchFunction = searchFunction;
    this.query = query;
    this.options = options;
    this.currentPage = [];
    this.nextPageToken = null;
    this.hasMore = true;
    this.totalResults = 0;
  }
  
  async fetchNextPage() {
    if (!this.hasMore) {
      return [];
    }
    
    const searchOptions = {
      ...this.options,
      nextPageToken: this.nextPageToken
    };
    
    const response = await this.searchFunction.call(
      this.client, 
      this.query, 
      searchOptions
    );
    
    if (response.error) {
      throw new Error(`Search failed: ${response.error.message}`);
    }
    
    this.currentPage = response.results;
    this.nextPageToken = response.pagination?.nextPageToken;
    this.hasMore = !!this.nextPageToken;
    this.totalResults = response.pagination?.total || 0;
    
    return this.currentPage;
  }
  
  async *getAllResults(maxResults = 1000) {
    let resultCount = 0;
    
    while (this.hasMore && resultCount < maxResults) {
      const page = await this.fetchNextPage();
      
      for (const result of page) {
        if (resultCount >= maxResults) break;
        yield result;
        resultCount++;
      }
    }
  }
}

// Usage
const paginator = new PaginatedSearchResults(
  client, 
  client.searchScriptures, 
  'faith'
);

// Get all results
for await (const result of paginator.getAllResults(100)) {
  console.log(result.title);
}
```

### Offset-Based Pagination
```javascript
class OffsetPaginator {
  constructor(client, searchFunction, query, options = {}) {
    this.client = client;
    this.searchFunction = searchFunction;
    this.query = query;
    this.options = options;
    this.pageSize = options.limit || 20;
    this.currentOffset = 0;
    this.totalResults = null;
  }
  
  async getPage(pageNumber) {
    const offset = (pageNumber - 1) * this.pageSize;
    
    const response = await this.searchFunction.call(this.client, this.query, {
      ...this.options,
      offset,
      limit: this.pageSize
    });
    
    if (response.error) {
      throw new Error(`Search failed: ${response.error.message}`);
    }
    
    this.totalResults = response.pagination?.total;
    
    return {
      results: response.results,
      pageNumber,
      totalPages: Math.ceil(this.totalResults / this.pageSize),
      totalResults: this.totalResults,
      hasNextPage: offset + this.pageSize < this.totalResults,
      hasPrevPage: pageNumber > 1
    };
  }
  
  async *getAllPages() {
    let pageNumber = 1;
    let hasMore = true;
    
    while (hasMore) {
      const page = await this.getPage(pageNumber);
      yield page;
      
      hasMore = page.hasNextPage;
      pageNumber++;
    }
  }
}
```

## Batching and Concurrency

### Batch Request Pattern
```javascript
class BatchProcessor {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
  }
  
  async processBatch(items, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += this.concurrency) {
      const batch = items.slice(i, i + this.concurrency);
      const batchPromises = batch.map(processor);
      const batchResults = await Promise.allSettled(batchPromises);
      
      results.push(...batchResults.map((result, index) => ({
        item: batch[index],
        success: result.status === 'fulfilled',
        result: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      })));
    }
    
    return results;
  }
}

// Usage for video metadata
const batchProcessor = new BatchProcessor(3);
const videoUrls = ['url1', 'url2', 'url3', 'url4', 'url5'];

const results = await batchProcessor.processBatch(
  videoUrls,
  url => client.fetchVideoMetadata(url)
);

results.forEach(({ item, success, result, error }) => {
  if (success) {
    console.log(`${item}: ${result.title}`);
  } else {
    console.error(`${item}: ${error.message}`);
  }
});
```

## Response Transformation

### Unified Response Format
```javascript
// Transform different endpoint responses to unified format
class ResponseTransformer {
  static transformVertexAI(response) {
    return {
      results: response.results.map(result => ({
        uri: this.extractUri(result.document.derivedStructData.fields.link.stringValue),
        title: result.document.derivedStructData.fields.title.stringValue,
        snippet: this.extractSnippet(result.document.derivedStructData.fields.snippets),
        contentType: 'web',
        metadata: {
          displayLink: result.document.derivedStructData.fields.displayLink?.stringValue
        }
      })),
      pagination: {
        total: response.totalSize,
        nextPageToken: response.nextPageToken
      }
    };
  }
  
  static transformScriptureSearch(response) {
    return {
      results: response.results.map(result => {
        const fields = result.document.structData.fields;
        return {
          uri: `/scriptures/${fields.collection_name.stringValue.toLowerCase().replace(/\s+/g, '-')}/${fields.book_titles.stringValue.toLowerCase().replace(/\s+/g, '-')}/${fields.chapter_name.stringValue}`,
          title: `${fields.verse_reference.stringValue}`,
          snippet: fields.content.stringValue,
          contentType: 'scripture',
          metadata: {
            collection: fields.collection_name.stringValue,
            book: fields.book_titles.stringValue,
            chapter: fields.chapter_name.stringValue,
            verse: fields.verse_number.stringValue,
            type: fields.member_type.stringValue
          }
        };
      }),
      pagination: {
        total: response.totalSize,
        nextPageToken: response.nextPageToken
      }
    };
  }
  
  static extractUri(link) {
    const match = link.match(/churchofjesuschrist\.org(\/[^?]+)/);
    return match ? match[1] : link;
  }
  
  static extractSnippet(snippetsField) {
    if (snippetsField?.listValue?.values?.[0]?.structValue?.fields?.snippet?.stringValue) {
      return snippetsField.listValue.values[0].structValue.fields.snippet.stringValue
        .replace(/<\/?b>/g, '')
        .replace(/&[a-z]+;/g, ' ');
    }
    return '';
  }
}
```

## Performance Optimization

### Request Deduplication
```javascript
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }
  
  async dedupe(key, requestFunction) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    const promise = requestFunction()
      .finally(() => {
        this.pendingRequests.delete(key);
      });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// Usage in client
class OptimizedGospelLibraryClient extends GospelLibraryClient {
  constructor(options = {}) {
    super(options);
    this.deduplicator = new RequestDeduplicator();
  }
  
  async searchScriptures(query, options = {}) {
    const key = `scriptures:${query}:${JSON.stringify(options)}`;
    return this.deduplicator.dedupe(key, () => {
      return super.searchScriptures(query, options);
    });
  }
}
```

### Timeout Handling
```javascript
function withTimeout(promise, timeoutMs = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

// Usage
async function safeSearch(client, query, options = {}) {
  try {
    return await withTimeout(
      client.searchScriptures(query, options),
      15000 // 15 second timeout
    );
  } catch (error) {
    if (error.message.includes('timed out')) {
      return createErrorResponse('Search request timed out', 'TIMEOUT');
    }
    throw error;
  }
}
```

## Multi-Language Support

### Language-Aware Client
```javascript
class MultiLanguageClient extends GospelLibraryClient {
  constructor(options = {}) {
    super(options);
    this.supportedLanguages = new Set(['eng', 'spa', 'fra', 'por', 'deu']);
    this.languageCache = new Map();
  }
  
  async getLocalizedStrings(lang) {
    if (this.languageCache.has(lang)) {
      return this.languageCache.get(lang);
    }
    
    const strings = await this.fetchSearchStrings(lang);
    
    if (!strings.error) {
      this.languageCache.set(lang, strings);
    }
    
    return strings;
  }
  
  async searchWithLocalization(query, options = {}) {
    const lang = options.lang || this.defaultLang;
    
    if (!this.supportedLanguages.has(lang)) {
      return createErrorResponse(
        `Language '${lang}' not supported`,
        'UNSUPPORTED_LANGUAGE'
      );
    }
    
    const [searchResults, strings] = await Promise.all([
      this.searchScriptures(query, options),
      this.getLocalizedStrings(lang)
    ]);
    
    if (searchResults.error) {
      return searchResults;
    }
    
    // Add localized labels
    return {
      ...searchResults,
      labels: strings.strings,
      language: lang
    };
  }
}
```

These patterns provide a foundation for building robust, scalable integrations with the Gospel Library search APIs while maintaining consistency and performance across different use cases.