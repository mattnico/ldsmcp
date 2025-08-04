# General Conference Search: `/search/proxy/general-conference-search`

Specialized search endpoint for General Conference talks with advanced filtering, date range support, and snippet highlighting powered by Google Vertex AI Search.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/general-conference-search`
- **HTTP Method:** `POST`
- **Content-Type:** `application/json`  
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search within General Conference content with advanced filtering and snippet highlighting

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```json
{ "query": "\"RESTORATION\"" }        // Finds exact word "RESTORATION"
{ "query": "\"plan of salvation\"" }  // Finds exact phrase "plan of salvation"
{ "query": "\"Russell M. Nelson\"" }  // Finds exact speaker name
```

**Fuzzy/Broad Search (Unquoted)**
```json
{ "query": "restoration" }           // Finds "restoration", "restored", "restoring", etc.
{ "query": "faith hope charity" }    // Finds content with any/all of these words
{ "query": "temple work" }           // Finds related concepts and variations
```

### When to Use Each Type
- **Quoted searches** are ideal for:
  - Specific doctrinal terms or phrases ("gospel of Jesus Christ")
  - Speaker names ("Henry B. Eyring")
  - Exact titles ("Come, Follow Me")
  - Technical or unique terminology ("Melchizedek Priesthood")

- **Unquoted searches** are better for:
  - Broad topic exploration (faith, prayer, service)
  - Finding related concepts and variations
  - Discovering different perspectives on themes
  - General research queries

## Request Format

### Required Request Body
```typescript
interface GeneralConferenceSearchRequest {
  query: string;        // Search query (supports quoted exact phrases)
  start: number;        // Starting result index (0-based)
  filter: string;       // Site search and language filtering
  orderBy?: string;     // Sort order (empty string for relevance)
  sort?: string;        // Additional sort parameter (empty string)
}
```

### Request Body Parameters
- **`query`**: Search query text
  - Supports exact phrase matching with quotes: `"RESTORATION"`
  - Case-insensitive search
  - Searches talk titles, content, and speaker names
- **`start`**: Starting index for pagination (0-based, e.g., 0 for first page, 10 for second page)
- **`filter`**: Complex filter string for site and language restrictions
  - Standard filter: `siteSearch:"churchofjesuschrist.org/study/general-conference" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"`
  - Date range filter (last year example): `(siteSearch:"churchofjesuschrist.org/study/general-conference/2024/04/" OR siteSearch:"churchofjesuschrist.org/study/general-conference/2024/10/" OR siteSearch:"churchofjesuschrist.org/study/general-conference/2025/04/") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*"...`
  - Date filtering uses OR clauses with specific year/month paths since General Conference only occurs in April (04) and October (10)
- **`orderBy`**: Sort order (typically empty string for default relevance)
- **`sort`**: Additional sort parameter (typically empty string)

### Request Example
```json
{
  "query": "\"RESTORATION\"",
  "start": 0,
  "filter": "siteSearch:\"churchofjesuschrist.org/study/general-conference\" AND (siteSearch:\"*lang=eng*\" OR -siteSearch:\"*lang=*\") AND -siteSearch:\"*imageView=*\" AND -siteSearch:\"*adbid=*\" AND -siteSearch:\"*adbpl=*\" AND -siteSearch:\"*adbpr=*\" AND -siteSearch:\"*cid=*\" AND -siteSearch:\"*short_code=*\" AND -siteSearch:\"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson\"",
  "orderBy": "",
  "sort": ""
}
```

## Response Format

### Success Response Structure
```typescript
interface GeneralConferenceSearchResponse {
  results: GeneralConferenceResult[];
  facets: any[];
  appliedControls: any[];
  geoSearchDebugInfo: any[];
  oneBoxResults: any[];
  totalSize: number;
  attributionToken: string;
  nextPageToken?: string;
  correctedQuery: string;
  guidedSearchResult: {
    refinementAttributes: any[];
    followUpQuestions: any[];
  };
  summary: {
    summarySkippedReasons: any[];
    summaryText: string;
    safetyAttributes: any;
    summaryWithMetadata: any;
  };
  redirectUri: string;
  queryExpansionInfo: {
    expandedQuery: boolean;
    pinnedResultCount: string;
  };
  naturalLanguageQueryUnderstandingInfo: any;
  sessionInfo: {
    name: string;
    queryId: string;
  };
}

interface GeneralConferenceResult {
  modelScores: {};
  id: string;
  document: {
    name: string;
    id: string;
    schemaId: string;
    derivedStructData: {
      fields: {
        title: { stringValue: string };           // Talk title
        snippets: {                               // Highlighted content snippets
          listValue: {
            values: Array<{
              structValue: {
                fields: {
                  snippet_status: { stringValue: string };  // "SUCCESS"
                  snippet: { stringValue: string };         // HTML with <b> highlighting
                }
              }
            }>
          }
        };
        can_fetch_raw_content: { stringValue: string };     // "true"
        htmlTitle: { stringValue: string };                 // HTML-formatted title
        displayLink: { stringValue: string };               // "www.churchofjesuschrist.org"
        link: { stringValue: string };                      // Full URL to talk
        datePublished?: { numberValue: number };            // Unix timestamp (microseconds)
      }
    };
    parentDocumentId: string;
    content: null;
    aclInfo: null;
    indexTime: null;
    indexStatus: null;
  };
  chunk: null;
}
```

### Response Example (Truncated)
```json
{
  "results": [
    {
      "modelScores": {},
      "id": "a2c22f1e22b52b8befc2c3b62b9f0740",
      "document": {
        "name": "projects/48669911638/locations/global/collections/default_collection/dataStores/vertex-search_1722877515092/branches/0/documents/a2c22f1e22b52b8befc2c3b62b9f0740",
        "id": "a2c22f1e22b52b8befc2c3b62b9f0740",
        "derivedStructData": {
          "fields": {
            "title": {
              "stringValue": "The Sacred Place of Restoration"
            },
            "snippets": {
              "listValue": {
                "values": [
                  {
                    "structValue": {
                      "fields": {
                        "snippet_status": {
                          "stringValue": "SUCCESS"
                        },
                        "snippet": {
                          "stringValue": "Palmyra was the stage of the <b>Restoration</b>, where the Father's voice would be heard after nearly two millennia. A good friend of mine who was a Church member..."
                        }
                      }
                    }
                  }
                ]
              }
            },
            "can_fetch_raw_content": {
              "stringValue": "true"
            },
            "htmlTitle": {
              "stringValue": "The Sacred Place of Restoration"
            },
            "displayLink": {
              "stringValue": "www.churchofjesuschrist.org"
            },
            "link": {
              "stringValue": "https://www.churchofjesuschrist.org/study/general-conference/2016/04/the-sacred-place-of-restoration?lang=eng"
            }
          }
        }
      }
    }
  ],
  "totalSize": 6214,
  "attributionToken": "qwLw0AoLCI7dw8QGEJWvplISJDY4ZWIxYWJlLTAwMDAtMjQxMy1hYTg5LWQ0ZjU0N2VjNGY2NCIHR0VORVJJQypAkPeyMLa3jC27kfoxvpH6MY6-nRXUsp0VwvCeFZjWty2b1rctxcvzF5WSxTCOkckw84nyMPClgDLwifIw86WAMjABShIweDE2NzM5NmFhOGQxMDE5NWVSlAFwcm9qZWN0cy80ODY2OTkxMTYzOC9sb2NhdGlvbnMvZ2xvYmFsL2NvbGxlY3Rpb25zL2RlZmF1bHRfGRTwTy9lbmdpbmVzL2NodXJjaHNlYXJjaGFkdmFuY2VkXzE3MjI4NzczMDg4Nzkvc2VydmluZ0NvbmZpZ3MvZGVmYXVsdF9zZWFyY2g6c2VhcmNo",
  "nextPageToken": "QjNmRzYldDN1YGNk1SO4EWYtMTMwITLwADMw0CZiFWMiVGO2QiGB4M1hzLEGQ80G7ICMIBMxIgC",
  "correctedQuery": "",
  "sessionInfo": {
    "name": "projects/48669911638/locations/global/collections/default_collection/engines/churchsearchadvanced_1722877308879/sessions/18285986527625663161",
    "queryId": "projects/48669911638/locations/global/questions/18285986527625663970"
  }
}
```

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async searchGeneralConference(query, options = {}) {
  let filter = 'siteSearch:"churchofjesuschrist.org/study/general-conference" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
  
  // Add date range filtering if specified
  if (options.dateRange) {
    const { startYear, endYear } = options.dateRange;
    const datePaths = [];
    
    for (let year = startYear; year <= endYear; year++) {
      // General Conference only occurs in April (04) and October (10)
      datePaths.push(`siteSearch:"churchofjesuschrist.org/study/general-conference/${year}/04/"`);
      datePaths.push(`siteSearch:"churchofjesuschrist.org/study/general-conference/${year}/10/"`);
    }
    
    filter = `(${datePaths.join(' OR ')}) AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"`;
  }
  
  const requestBody = {
    query: query,
    start: options.start || 0,
    filter: filter,
    orderBy: options.orderBy || "",
    sort: options.sort || ""
  };
  
  const url = 'https://www.churchofjesuschrist.org/search/proxy/general-conference-search';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      return {
        error: {
          message: `HTTP error! status: ${response.status}`,
          code: response.status.toString(),
        },
      };
    }

    const data = await response.json();
    
    // Transform to standard format
    return {
      results: data.results.map(result => {
        const fields = result.document.derivedStructData.fields;
        return {
          uri: this.extractUriFromLink(fields.link.stringValue),
          title: fields.title.stringValue,
          snippet: this.extractSnippet(fields.snippets),
          link: fields.link.stringValue,
          displayLink: fields.displayLink.stringValue,
          datePublished: fields.datePublished ? new Date(fields.datePublished.numberValue / 1000) : null,
          canFetchContent: fields.can_fetch_raw_content?.stringValue === "true"
        };
      }),
      pagination: {
        total: data.totalSize,
        nextPageToken: data.nextPageToken,
        start: options.start || 0
      },
      searchType: 'general-conference',
      metadata: {
        sessionInfo: data.sessionInfo,
        attributionToken: data.attributionToken,
        correctedQuery: data.correctedQuery
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

// Utility method to extract clean snippet text
extractSnippet(snippetsField) {
  if (snippetsField?.listValue?.values?.[0]?.structValue?.fields?.snippet?.stringValue) {
    return snippetsField.listValue.values[0].structValue.fields.snippet.stringValue
      .replace(/<\/?b>/g, '') // Remove bold tags
      .replace(/&[a-z]+;/g, ' ') // Replace HTML entities
      .replace(/&#39;/g, "'"); // Replace apostrophe entities
  }
  return '';
}
```

### Usage Examples

#### Exact Phrase Searches
```javascript
// Search for exact doctrinal phrase
const doctrinalResults = await client.searchGeneralConference('"plan of salvation"');

// Search for exact speaker name  
const nelsonTalks = await client.searchGeneralConference('"Russell M. Nelson"');

// Search for exact program title
const cfmTalks = await client.searchGeneralConference('"Come, Follow Me"');

// Search for specific terminology
const priesthood = await client.searchGeneralConference('"Melchizedek Priesthood"');
```

#### Fuzzy/Broad Searches
```javascript
// Broad topic exploration - finds "faith", "faithful", "faithfulness", etc.
const faithTalks = await client.searchGeneralConference('faith');

// Multi-word broad search - finds talks containing any/all of these concepts
const virtueSearch = await client.searchGeneralConference('faith hope charity');

// Theme-based search - finds various related concepts
const templeWork = await client.searchGeneralConference('temple work family history');

// General topic - finds many related concepts and perspectives
const serviceSearch = await client.searchGeneralConference('service others community');
```

#### Combined with Date Filtering
```javascript
// Exact phrase search within date range
const recentRestoration = await client.searchGeneralConference('"restoration"', {
  dateRange: { startYear: 2020, endYear: 2024 }
});

// Broad search for recent talks on a theme
const recentFaith = await client.searchGeneralConference('faith trials adversity', {
  dateRange: { startYear: 2022, endYear: 2024 }
});
```

### MCP Tool Integration
```javascript
// Add General Conference search tool to working-server.js
async function handleSearchGeneralConference(args, messageId) {
  const { query, limit = 20, offset = 0 } = args;
  
  try {
    const searchResponse = await gospelLibraryClient.searchGeneralConference(query, {
      start: offset
    });
    
    if (searchResponse.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Error searching General Conference: ${searchResponse.error.message}`
          }]
        }
      });
      return;
    }

    let resultText = `# General Conference Search Results for "${query}"\n\n`;
    resultText += `Found ${searchResponse.pagination.total} total results:\n\n`;

    searchResponse.results.slice(0, limit).forEach((result, index) => {
      resultText += `## ${index + 1}. ${result.title}\n`;
      resultText += `**Link:** ${result.link}\n`;
      resultText += `**URI:** ${result.uri}\n`;
      if (result.datePublished) {
        resultText += `**Date:** ${result.datePublished.toDateString()}\n`;
      }
      if (result.snippet) {
        resultText += `**Snippet:** ${result.snippet}\n`;
      }
      resultText += `\n`;
    });
    
    if (searchResponse.pagination.nextPageToken) {
      resultText += `*Use offset ${offset + limit} to get next page of results*\n`;
    }

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
    sendMessage({
      jsonrpc: "2.0",
      id: messageId,
      result: {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }]
      }
    });
  }
}

// Add to tool definitions array
{
  name: "search_general_conference",
  description: "Search within General Conference talks with advanced filtering and highlighting",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query text (use quotes for exact phrases)"
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
      }
    },
    required: ["query"]
  }
}
```

## Testing Information

### cURL Testing Commands
```bash
# Basic General Conference search
curl -X POST "https://www.churchofjesuschrist.org/search/proxy/general-conference-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "\"RESTORATION\"",
    "start": 0,
    "filter": "siteSearch:\"churchofjesuschrist.org/study/general-conference\" AND (siteSearch:\"*lang=eng*\" OR -siteSearch:\"*lang=*\") AND -siteSearch:\"*imageView=*\" AND -siteSearch:\"*adbid=*\" AND -siteSearch:\"*adbpl=*\" AND -siteSearch:\"*adbpr=*\" AND -siteSearch:\"*cid=*\" AND -siteSearch:\"*short_code=*\" AND -siteSearch:\"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson\"",
    "orderBy": "",
    "sort": ""
  }'

# Search with pagination
curl -X POST "https://www.churchofjesuschrist.org/search/proxy/general-conference-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "faith",
    "start": 10,
    "filter": "siteSearch:\"churchofjesuschrist.org/study/general-conference\" AND (siteSearch:\"*lang=eng*\" OR -siteSearch:\"*lang=*\")",
    "orderBy": "",
    "sort": ""
  }'

# Search talks from last year (2024-2025) - optimized for April and October only
curl -X POST "https://www.churchofjesuschrist.org/search/proxy/general-conference-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "\"RESTORATION\"",
    "start": 0,
    "filter": "(siteSearch:\"churchofjesuschrist.org/study/general-conference/2024/04/\" OR siteSearch:\"churchofjesuschrist.org/study/general-conference/2024/10/\" OR siteSearch:\"churchofjesuschrist.org/study/general-conference/2025/04/\") AND (siteSearch:\"*lang=eng*\" OR -siteSearch:\"*lang=*\") AND -siteSearch:\"*imageView=*\" AND -siteSearch:\"*adbid=*\" AND -siteSearch:\"*adbpl=*\" AND -siteSearch:\"*adbpr=*\" AND -siteSearch:\"*cid=*\" AND -siteSearch:\"*short_code=*\"",
    "orderBy": "",
    "sort": ""
  }'
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| JSON parsing errors | 400 Bad Request | Ensure proper JSON formatting in request body |
| Filter syntax errors | Empty results or errors | Use the standard filter template provided |
| Large result sets | Slow response | Use pagination with reasonable page sizes (20-50 results) |
| Encoding issues | Malformed snippets | Handle HTML entities in snippet extraction |

## Date Range Filtering

### Conference Schedule
General Conference occurs twice yearly:
- **April Conference**: Month `04` 
- **October Conference**: Month `10`

### Efficient Date Filtering
```javascript
// ✅ Efficient: Only include actual conference months
const filter = `(siteSearch:"churchofjesuschrist.org/study/general-conference/2024/04/" OR siteSearch:"churchofjesuschrist.org/study/general-conference/2024/10/" OR siteSearch:"churchofjesuschrist.org/study/general-conference/2025/04/") AND ...`;

// ❌ Inefficient: Including all 12 months
const badFilter = `(siteSearch:"churchofjesuschrist.org/study/general-conference/2024/08/" OR siteSearch:"churchofjesuschrist.org/study/general-conference/2024/09/" OR ... 12 months total) AND ...`;
```

### Date Range Implementation
```javascript
// Search for talks from specific years
const searchOptions = {
  dateRange: {
    startYear: 2020,
    endYear: 2024
  }
};

// This will generate filters for: 2020/04, 2020/10, 2021/04, 2021/10, ... 2024/04, 2024/10
```

## Notes

- This endpoint is specifically optimized for **General Conference content search**
- Results include **highlighted snippets** with `<b>` tags around matching terms
- The endpoint supports **exact phrase matching** with quoted queries
- **Pagination** uses 0-based indexing (start=0 for first page, start=10 for second page of 10 results)
- Returns **comprehensive results** - 6,214 total for "RESTORATION" query shows extensive coverage
- **Date filtering** is handled through the filter parameter site search restrictions
- The response includes **advanced Vertex AI features** like query correction and guided search
- **Session tracking** is provided through sessionInfo for analytics
- Results are **relevance-ranked** by the Vertex AI search infrastructure
- The filter template provided focuses on **English content** and excludes unwanted URL parameters
- **Date Range Filtering**: General Conference only occurs in **April (04) and October (10)**, so date filters should use only these months rather than including all 12 months of the year
- **Efficient Date Queries**: For "last year" searches, only include the relevant conference months: `2024/04/`, `2024/10/`, and `2025/04/` (not all months 08-08)

## Related Documentation

- [Vertex Search](vertex-search.md) - Multi-type search across all Gospel Library content
- [Scripture Search](scripture-search.md) - Verse-level scripture search with collection filtering
- [Video Metadata](video-metadata.md) - Enhanced video information for conference talks