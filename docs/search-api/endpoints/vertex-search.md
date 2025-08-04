# Google Vertex AI Search: `/search/proxy/vertex-search`

Multi-type search endpoint powered by Google Vertex AI Search (Enterprise Search) infrastructure, supporting web content, images, videos, music, and PDF documents.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
// For web searches - query in filter parameter
filter: '(siteSearch:"www.churchofjesuschrist.org") AND "plan of salvation"'

// For image/video searches - query in q parameter  
q: '"temple ceremony"'     // Finds exact phrase in media descriptions
q: '"Russell M. Nelson"'   // Finds specific speaker in video titles
```

**Fuzzy/Broad Search (Unquoted)**  
```javascript
// For web searches - broader matching
filter: '(siteSearch:"www.churchofjesuschrist.org") AND restoration gospel'

// For image/video searches - finds variations and related content
q: 'restoration'           // Finds "restoration", "restored", "restoring", etc.
q: 'temple family'         // Finds content with temple AND/OR family themes
```

### Search Type Specific Behavior
- **Web Search**: Query terms integrated into complex filter expressions
- **Image Search**: Uses `q` parameter for image metadata and description matching
- **Video Search**: Uses `q` parameter for video titles, descriptions, and speaker names
- **Music Search**: Uses `q` parameter for hymn titles, composer names, and themes
- **PDF Search**: Uses `q` parameter for document content and metadata

### When to Use Each Type
- **Quoted searches** are ideal for:
  - Specific doctrinal phrases ("priesthood authority")
  - Exact titles or names ("Preach My Gospel")
  - Technical terminology ("Urim and Thummim")
  - Speaker or author names ("Jeffrey R. Holland")

- **Unquoted searches** are better for:
  - Broad topic exploration (faith, prayer, charity)
  - Finding thematically related content
  - Discovering various perspectives on concepts
  - Media searches where exact matching may be too restrictive

## Parameters

### Required Parameters
```typescript
interface VertexSearchParams {
  start: number;        // Starting result index (1-based)
  searchType: string;   // Type of search: "web" | "image" | "video"
  filter: string;       // Complex filter expression for site/content filtering
  q?: string;           // Query text (for image/video searches)
  orderBy?: string;     // Sort order (can be empty string for default relevance)
}
```

### Query Parameters
- **`start`**: Starting index for results (e.g., `1` for first page, `76` for pagination)
- **`searchType`**: Type of search
  - `"web"` - Text/content search
  - `"image"` - Image search
  - `"video"` - Video search
  - `"music"` - Music search
  - `"pdf"` - PDF document search
- **`q`**: Query text (used for image/video searches, e.g., `"RESTORATION"`)
- **`filter`**: Complex filter string that includes:
  - Site search restrictions
  - Language filtering
  - Exclusion of specific URL patterns
  - **Web search example**: `(siteSearch:"www.churchofjesuschrist.org" OR siteSearch:"newsroom.churchofjesuschrist.org" OR siteSearch:"history.churchofjesuschrist.org") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*"`
  - **Image search example**: `-siteSearch:"speeches.byu.edu" AND -siteSearch:"churchhistorianspress.org" AND -siteSearch:"josephsmithpapers.org"`
  - **Video search example**: `siteSearch:"churchofjesuschrist.org/media/video/*" AND -siteSearch:"*.?*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"`
  - **Music search example**: `siteSearch:"churchofjesuschrist.org/media/music" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"`
  - **PDF search example**: `siteSearch:"churchofjesuschrist.org*.pdf*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"`
- **`orderBy`**: Sort order (can be empty string for default relevance)

### Parameter Examples
```javascript
// Basic search for "searchTerms"
const params = new URLSearchParams({
  start: "1",
  searchType: "web",
  filter: '(siteSearch:"www.churchofjesuschrist.org" OR siteSearch:"newsroom.churchofjesuschrist.org" OR siteSearch:"history.churchofjesuschrist.org") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*"',
  orderBy: ""
});
```

## Response Format

### Success Response Structure
```typescript
interface VertexSearchResponse {
  results: VertexSearchResult[];
  totalSize: number;
  nextPageToken?: string;
  attributionToken: string;
  correctedQuery: string;
  sessionInfo: {
    name: string;
    queryId: string;
  };
  facets: any[];
  appliedControls: any[];
  guidedSearchResult: {
    refinementAttributes: any[];
    followUpQuestions: any[];
  };
  summary: {
    summaryText: string;
    summarySkippedReasons: any[];
  };
  queryExpansionInfo: {
    expandedQuery: boolean;
    pinnedResultCount: string;
  };
}

interface VertexSearchResult {
  id: string;
  modelScores: {};
  document: {
    id: string;
    name: string;
    derivedStructData: {
      fields: {
        title: { stringValue: string };
        htmlTitle: { stringValue: string };
        link: { stringValue: string };
        displayLink: { stringValue: string };
        // For web search results
        snippets?: {
          listValue: {
            values: Array<{
              structValue: {
                fields: {
                  snippet: { stringValue: string };
                  snippet_status: { stringValue: string };
                }
              }
            }>
          }
        };
        // For image search results
        image?: {
          structValue: {
            fields: {
              width: { numberValue: number };
              height: { numberValue: number };
              thumbnailWidth: { numberValue: number };
              thumbnailHeight: { numberValue: number };
              thumbnailLink: { stringValue: string };
              contextLink: { stringValue: string };
            }
          }
        };
        fileFormat?: { stringValue: string };
        mime?: { stringValue: string };
        can_fetch_raw_content?: { stringValue: string };
        // For PDF and other content with publication dates
        datePublished?: { numberValue: number };
        dateModified?: { numberValue: number };
      }
    }
  };
}
```

### Response Example (Truncated)
```json
{
  "results": [
    {
      "id": "cf5b35f3a6f2b757e46d92f9513a5eb1",
      "document": {
        "derivedStructData": {
          "fields": {
            "title": {
              "stringValue": "metadata-searchTerms"
            },
            "link": {
              "stringValue": "https://www.churchofjesuschrist.org/schema/ldsxml/scripture/docs/metadata-searchTerms.html"
            },
            "snippets": {
              "listValue": {
                "values": [{
                  "structValue": {
                    "fields": {
                      "snippet": {
                        "stringValue": "<b>searchTerms</b> · Definition · Child Nodes or Content · Parent Elements · Code Sample · Notes · See Also · Marking in Microsoft Word."
                      }
                    }
                  }
                }]
              }
            }
          }
        }
      }
    }
  ],
  "totalSize": 4042,
  "nextPageToken": "AO1kjM2UWZ0EzY0..."
}
```

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class in working-server.js
async searchVertexAI(query, options = {}) {
  const searchType = options.searchType || 'web';
  let filter = '';
  
  if (searchType === 'web') {
    const baseFilter = '(siteSearch:"www.churchofjesuschrist.org" OR siteSearch:"newsroom.churchofjesuschrist.org" OR siteSearch:"history.churchofjesuschrist.org") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*"';
    filter = query ? `${baseFilter} AND "${query}"` : baseFilter;
  } else if (searchType === 'image') {
    // Image search uses different filter pattern
    filter = '-siteSearch:"speeches.byu.edu" AND -siteSearch:"churchhistorianspress.org" AND -siteSearch:"josephsmithpapers.org"';
  } else if (searchType === 'video') {
    // Video search filters for video content specifically
    filter = 'siteSearch:"churchofjesuschrist.org/media/video/*" AND -siteSearch:"*.?*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
  } else if (searchType === 'music') {
    // Music search filters for music content specifically  
    filter = 'siteSearch:"churchofjesuschrist.org/media/music" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
  } else if (searchType === 'pdf') {
    // PDF search filters for PDF documents
    filter = 'siteSearch:"churchofjesuschrist.org*.pdf*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
  }
  
  const params = new URLSearchParams({
    start: String(options.start || 1),
    searchType: searchType,
    filter: filter,
    orderBy: options.orderBy || ""
  });
  
  // For image/video/music/pdf search, add query as 'q' parameter
  if ((searchType === 'image' || searchType === 'video' || searchType === 'music' || searchType === 'pdf') && query) {
    params.append('q', query);
  }
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-search?${params}`;
  
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

    const data = await response.json();
    
    // Transform Vertex AI response to standard format
    return {
      results: data.results.map(result => {
        const fields = result.document.derivedStructData.fields;
        
        if (searchType === 'image') {
          return {
            uri: this.extractUriFromLink(fields.link.stringValue),
            title: fields.title.stringValue,
            link: fields.link.stringValue,
            displayLink: fields.displayLink.stringValue,
            image: {
              url: fields.link.stringValue,
              thumbnailUrl: fields.image?.structValue?.fields?.thumbnailLink?.stringValue,
              width: fields.image?.structValue?.fields?.width?.numberValue,
              height: fields.image?.structValue?.fields?.height?.numberValue,
              contextLink: fields.image?.structValue?.fields?.contextLink?.stringValue
            },
            mime: fields.mime?.stringValue,
            fileFormat: fields.fileFormat?.stringValue
          };
        } else {
          return {
            uri: this.extractUriFromLink(fields.link.stringValue),
            title: fields.title.stringValue,
            snippet: this.extractSnippet(fields.snippets),
            link: fields.link.stringValue,
            displayLink: fields.displayLink.stringValue
          };
        }
      }),
      pagination: {
        total: data.totalSize,
        nextPageToken: data.nextPageToken,
        start: options.start || 1
      },
      searchType: searchType,
      metadata: {
        sessionInfo: data.sessionInfo,
        attributionToken: data.attributionToken
      }
    };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'FETCH_ERROR',
      },
    };
  }
}

// Helper methods
extractUriFromLink(link) {
  // Extract Gospel Library URI from full URL
  const match = link.match(/churchofjesuschrist\.org(\/[^?]+)/);
  return match ? match[1] : link;
}

extractSnippet(snippetsField) {
  if (snippetsField?.listValue?.values?.[0]?.structValue?.fields?.snippet?.stringValue) {
    return snippetsField.listValue.values[0].structValue.fields.snippet.stringValue
      .replace(/<\/?b>/g, '') // Remove bold tags
      .replace(/&[a-z]+;/g, ' '); // Replace HTML entities
  }
  return '';
}
```

### MCP Tool Enhancement
```javascript
// Enhanced search tool using Vertex AI
async function handleSearchGospelLibrary(args, messageId) {
  const { query, contentType, limit = 20, offset = 0 } = args;
  
  try {
    // Calculate start index from offset
    const start = offset + 1;
    
    // Use Vertex AI search
    const searchResponse = await gospelLibraryClient.searchVertexAI(query, {
      start: start,
      contentType: contentType // Note: contentType filtering may need custom implementation
    });
    
    if (searchResponse.error) {
      // Fallback to pattern-based search
      await handleSearchGospelLibraryLegacy(args, messageId);
      return;
    }

    // Format results for MCP response
    let resultText = `# Search Results for "${query}"\\n\\n`;
    resultText += `Found ${searchResponse.pagination.total} total results:\\n\\n`;

    searchResponse.results.slice(0, limit).forEach((result, index) => {
      resultText += `## ${index + 1}. ${result.title}\\n`;
      resultText += `**Link:** ${result.link}\\n`;
      resultText += `**URI:** ${result.uri}\\n`;
      if (result.snippet) {
        resultText += `**Snippet:** ${result.snippet}\\n`;
      }
      resultText += `\\n`;
    });

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
    console.error('Vertex AI search error:', error);
    // Fallback to existing pattern-based search
    await handleSearchGospelLibraryLegacy(args, messageId);
  }
}
```

## Usage Examples

### Web Search Examples

#### Exact Phrase Web Searches
```javascript
// Search for exact doctrinal phrase
const doctrinalResults = await client.searchVertexAI({
  searchType: 'web',
  filter: '(siteSearch:"www.churchofjesuschrist.org") AND "plan of salvation"'
});

// Search for specific program or manual
const manualResults = await client.searchVertexAI({
  searchType: 'web', 
  filter: '(siteSearch:"www.churchofjesuschrist.org") AND "Preach My Gospel"'
});
```

#### Fuzzy/Broad Web Searches  
```javascript
// Broad topic exploration
const faithResults = await client.searchVertexAI({
  searchType: 'web',
  filter: '(siteSearch:"www.churchofjesuschrist.org") AND faith prayer testimony'
});

// Thematic search
const familyResults = await client.searchVertexAI({
  searchType: 'web',
  filter: '(siteSearch:"www.churchofjesuschrist.org") AND family home evening'
});
```

### Image Search Examples

#### Exact Image Searches
```javascript
// Search for specific temple images
const templeImages = await client.searchVertexAI({
  searchType: 'image',
  q: '"Salt Lake Temple"',
  filter: '-siteSearch:"speeches.byu.edu"'
});

// Search for specific artwork
const artImages = await client.searchVertexAI({
  searchType: 'image', 
  q: '"Arnold Friberg"',
  filter: '-siteSearch:"churchhistorianspress.org"'
});
```

#### Fuzzy Image Searches
```javascript
// General category search
const templeImages = await client.searchVertexAI({
  searchType: 'image',
  q: 'temple sacred',
  filter: '-siteSearch:"speeches.byu.edu"'
});

// Theme-based search
const familyImages = await client.searchVertexAI({
  searchType: 'image',
  q: 'family children home',
  filter: '-siteSearch:"churchhistorianspress.org"'
});
```

### Video Search Examples

#### Exact Video Searches
```javascript
// Search for specific speaker videos
const nelsonVideos = await client.searchVertexAI({
  searchType: 'video',
  q: '"Russell M. Nelson"',
  filter: 'siteSearch:"churchofjesuschrist.org/media/video/*"'
});

// Search for specific topics
const restorationVideos = await client.searchVertexAI({
  searchType: 'video',
  q: '"restoration"', 
  filter: 'siteSearch:"churchofjesuschrist.org/media/video/*"'
});
```

#### Fuzzy Video Searches
```javascript
// Topic exploration
const faithVideos = await client.searchVertexAI({
  searchType: 'video',
  q: 'faith trials adversity',
  filter: 'siteSearch:"churchofjesuschrist.org/media/video/*"'
});

// Broad thematic search
const youthVideos = await client.searchVertexAI({
  searchType: 'video',
  q: 'youth young adults',
  filter: 'siteSearch:"churchofjesuschrist.org/media/video/*"'
});
```

### Music Search Examples

#### Exact Music Searches
```javascript
// Search for specific hymns
const hymnResults = await client.searchVertexAI({
  searchType: 'music',
  q: '"Amazing Grace"',
  filter: 'siteSearch:"churchofjesuschrist.org/media/music"'
});

// Search for specific composers
const composerMusic = await client.searchVertexAI({
  searchType: 'music',
  q: '"Janice Kapp Perry"',
  filter: 'siteSearch:"churchofjesuschrist.org/media/music"'
});
```

#### Fuzzy Music Searches
```javascript
// Thematic music search
const christmasMusic = await client.searchVertexAI({
  searchType: 'music',
  q: 'christmas nativity birth',
  filter: 'siteSearch:"churchofjesuschrist.org/media/music"'
});

// Mood or occasion search
const worshipMusic = await client.searchVertexAI({
  searchType: 'music', 
  q: 'worship reverent sacrament',
  filter: 'siteSearch:"churchofjesuschrist.org/media/music"'
});
```

### PDF Search Examples

#### Exact PDF Searches
```javascript
// Search for specific manual PDFs
const manualPDFs = await client.searchVertexAI({
  searchType: 'pdf',
  q: '"Gospel Principles"',
  filter: 'siteSearch:"churchofjesuschrist.org*.pdf*"'
});

// Search for specific lesson content
const lessonPDFs = await client.searchVertexAI({
  searchType: 'pdf',
  q: '"Come, Follow Me"',
  filter: 'siteSearch:"churchofjesuschrist.org*.pdf*"'
});
```

#### Fuzzy PDF Searches
```javascript
// Topic-based PDF search
const doctrinalPDFs = await client.searchVertexAI({
  searchType: 'pdf',
  q: 'atonement salvation redemption',
  filter: 'siteSearch:"churchofjesuschrist.org*.pdf*"'
});

// Teaching resource search
const teachingPDFs = await client.searchVertexAI({
  searchType: 'pdf',
  q: 'teaching lesson activities',
  filter: 'siteSearch:"churchofjesuschrist.org*.pdf*"'
});
```

## Testing Information

### Test Cases
```javascript
// Test 1: Basic web search
GET https://www.churchofjesuschrist.org/search/proxy/vertex-search?start=1&searchType=web&filter=(siteSearch:"www.churchofjesuschrist.org")&orderBy=

// Test 2: Web search with pagination
GET https://www.churchofjesuschrist.org/search/proxy/vertex-search?start=11&searchType=web&filter=(siteSearch:"www.churchofjesuschrist.org")&orderBy=

// Test 3: Language-specific web search
GET https://www.churchofjesuschrist.org/search/proxy/vertex-search?start=1&searchType=web&filter=(siteSearch:"www.churchofjesuschrist.org") AND (siteSearch:"*lang=spa*")&orderBy=

// Test 4: Image search for "RESTORATION"
GET https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=image&filter=-siteSearch:"speeches.byu.edu"+AND+-siteSearch:"churchhistorianspress.org"+AND+-siteSearch:"josephsmithpapers.org"

// Test 5: Image search with pagination
GET https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=temple&start=76&searchType=image&filter=-siteSearch:"speeches.byu.edu"+AND+-siteSearch:"churchhistorianspress.org"+AND+-siteSearch:"josephsmithpapers.org"

// Test 6: Music search for "RESTORATION"
GET https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=music&filter=siteSearch:"churchofjesuschrist.org/media/music"+AND+(siteSearch:"*lang=eng*"+OR+-siteSearch:"*lang=*")

// Test 7: PDF search for "RESTORATION"
GET https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=pdf&filter=siteSearch:"churchofjesuschrist.org*.pdf*"+AND+(siteSearch:"*lang=eng*"+OR+-siteSearch:"*lang=*")
```

### cURL Testing Commands
```bash
# Basic web search test
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?start=1&searchType=web&filter=(siteSearch:%22www.churchofjesuschrist.org%22)&orderBy="

# Web search with complex filter
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?start=1&searchType=web&filter=(siteSearch:%22www.churchofjesuschrist.org%22%20OR%20siteSearch:%22newsroom.churchofjesuschrist.org%22)%20AND%20(siteSearch:%22*lang=eng*%22)&orderBy="

# Image search for "RESTORATION"
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=image&filter=-siteSearch:%22speeches.byu.edu%22%20AND%20-siteSearch:%22churchhistorianspress.org%22%20AND%20-siteSearch:%22josephsmithpapers.org%22"

# Image search with pagination
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=temple&start=76&searchType=image&filter=-siteSearch:%22speeches.byu.edu%22%20AND%20-siteSearch:%22churchhistorianspress.org%22%20AND%20-siteSearch:%22josephsmithpapers.org%22"

# Music search for "RESTORATION"
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=music&filter=siteSearch:%22churchofjesuschrist.org/media/music%22%20AND%20(siteSearch:%22*lang=eng*%22%20OR%20-siteSearch:%22*lang=*%22)"

# PDF search for "RESTORATION"
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=pdf&filter=siteSearch:%22churchofjesuschrist.org*.pdf*%22%20AND%20(siteSearch:%22*lang=eng*%22%20OR%20-siteSearch:%22*lang=*%22)"
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Query encoding | 400 errors | Ensure proper URL encoding of filter parameter |
| No query in results | Results don't match search intent | Query term may need to be added to filter string |
| Large result sets | Slow response | Use pagination with smaller page sizes |
| Filter syntax errors | Empty results or errors | Validate parentheses and quote matching in filter |

## Notes

- This endpoint uses Google's Vertex AI Search infrastructure (formerly Enterprise Search)
- The `filter` parameter uses a complex boolean syntax similar to Google Search operators
- Supports multiple search types:
  - **Web search**: Returns text content with snippets
  - **Image search**: Returns images with metadata (dimensions, thumbnails, context links)
  - **Video search**: Returns video content from churchofjesuschrist.org/media/video/*
  - **Music search**: Returns music content from churchofjesuschrist.org/media/music
  - **PDF search**: Returns PDF documents from across Church domains
- For image/video/music/pdf searches:
  - Query is passed via the `q` parameter instead of being embedded in the filter
  - Different filter patterns are used (mainly exclusions)
  - Results include image metadata like dimensions, thumbnail URLs, and context links
- Results include highlighted snippets with `<b>` tags around matching terms (web search)
- The response includes advanced features like query correction, guided search, and summaries (though these may be empty)
- Pagination uses `nextPageToken` which should be used for subsequent requests
- Total results for image searches can be substantial (e.g., 180 images for "RESTORATION")
- Music search results include both individual songs and collections (hymns, children's songs, etc.)
- Music search returned 1,547 total results for "RESTORATION" query, showing the extensive music library
- PDF search returns a variety of document types:
  - Official proclamations and declarations (e.g., "The Restoration of the Fulness of the Gospel")  
  - Teaching manuals and institute materials (e.g., "Foundations of the Restoration Teacher Manual")
  - Magazine content from Friend, Liahona, and other publications
  - Language-specific materials and resources
- PDF search returned 1,186 total results, showing comprehensive document coverage
- PDF results include `datePublished` timestamps for chronological sorting

## Related Documentation

- [General Conference Search](general-conference-search.md) - Specialized conference search with date filtering
- [Scripture Search](scripture-search.md) - Verse-level scripture search
- [Video Metadata](video-metadata.md) - Enhanced video information and download URLs