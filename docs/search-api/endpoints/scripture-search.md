# Scripture Search: `/search/proxy/vertex-scripture-search`

Verse-level scripture search with collection and book filtering, powered by Google Vertex AI Search infrastructure.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Purpose:** Search within scripture text at verse-level granularity with collection and book filtering

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
// Search for exact phrases in scripture text
query: '"faith without works"'      // Finds exact phrase from James 2
query: '"plan of salvation"'        // Finds exact doctrinal phrase
query: '"ask, and it shall be given"' // Finds exact quotation from Matthew/3 Nephi
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
// Broad concept search - finds various forms and related terms
query: 'faith'                      // Finds "faith", "faithful", "faithfulness", etc.
query: 'love charity'               // Finds verses with love AND/OR charity concepts
query: 'prayer fasting'             // Finds related spiritual practices
```

### When to Use Each Type

**Quoted searches** are ideal for:
- **Exact scriptural phrases**: "strait is the gate", "by their fruits ye shall know them"
- **Specific doctrinal terms**: "priesthood authority", "gift of the Holy Ghost"
- **Known quotations**: "faith is the substance of things hoped for"
- **Proper names or places**: "Zarahemla", "City of Enoch"

**Unquoted searches** are better for:
- **Thematic study**: faith hope charity (finds verses containing any/all themes)
- **Concept exploration**: atonement sacrifice redemption
- **Cross-referencing**: temple worship ordinances
- **Broad topic research**: family eternal marriage

### Collection-Specific Considerations
- **Book of Mormon**: Rich in doctrinal phrases and unique terminology
- **New Testament**: Many quoted phrases familiar from Christian tradition
- **Old Testament**: Historical names and places benefit from exact matching
- **D&C**: Modern revelations with specific doctrinal terminology
- **Pearl of Great Price**: Unique accounts benefit from both search types

## Parameters

### Required Parameters
```typescript
interface ScriptureSearchParams {
  query: string;          // Search query text (supports exact phrases with quotes)
  collectionName: string; // Scripture collection filter or "*" for all
  bookTitle: string;      // Book name filter or "*" for all books in collection
  start: number;          // Starting result index (1-based)
}
```

### Query Parameters
- **`query`**: Search query text
  - Supports exact phrase matching with quotes: `"RESTORATION"`
  - Case-insensitive search
  - Searches verse content, chapter headers, and cross-references
- **`collectionName`**: Filter by scripture collection
  - `"*"` - All collections (default)
  - `"The Old Testament"` - Old Testament only
  - `"The New Testament"` - New Testament only
  - `"The Book of Mormon"` - Book of Mormon only
  - `"Doctrine and Covenants"` - D&C and Official Declarations
  - `"The Pearl of Great Price"` - Pearl of Great Price only
- **`bookTitle`**: Filter by specific book
  - `"*"` - All books in collection (default)
  - Specific book names: `"Isaiah"`, `"Alma"`, `"Genesis"`, etc.
- **`start`**: Starting index for pagination (1-based, default: 1)

## Response Format

### Success Response Structure
```typescript
interface ScriptureSearchResponse {
  results: ScriptureSearchResult[];
  totalSize: number;
  nextPageToken?: string;
  attributionToken: string;
  correctedQuery: string;
  sessionInfo?: {
    name: string;
    queryId: string;
  };
  // Standard Vertex AI response fields
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
}

interface ScriptureSearchResult {
  id: string;
  modelScores: {};
  document: {
    id: string;
    name: string;
    derivedStructData: {
      fields: {
        can_fetch_raw_content: { stringValue: string };
        is_exact_match_query: { numberValue: number };
        url: { stringValue: string };
      }
    };
    structData: {
      fields: {
        verse_number: { stringValue: string };        // "0" for chapter headers, verse number for verses
        content: { stringValue: string };             // Actual verse text or chapter header text
        verse_reference: { stringValue: string };     // e.g., "Alma 41:12", "Isaiah 35"
        member_type: { stringValue: string };         // "verse" | "chapter header"
        chapter_name: { stringValue: string };        // Chapter number
        collection_name: { stringValue: string };     // e.g., "The Book of Mormon"
        book_titles: { stringValue: string };         // Book name e.g., "Alma", "Isaiah"
        url: { stringValue: string };                 // Direct link to verse/chapter
      }
    };
  };
}
```

### Response Example (Truncated)
```json
{
  "results": [
    {
      "id": "d3eb2cb7253853d6b6f81fc38bdcdb69",
      "document": {
        "structData": {
          "fields": {
            "verse_number": { "stringValue": "12" },
            "content": { "stringValue": "And now behold, is the meaning of the word restoration to take a thing of a natural state and place it in an unnatural state..." },
            "verse_reference": { "stringValue": "Alma 41:12" },
            "member_type": { "stringValue": "verse" },
            "chapter_name": { "stringValue": "41" },
            "collection_name": { "stringValue": "The Book of Mormon" },
            "book_titles": { "stringValue": "Alma" },
            "url": { "stringValue": "https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/41?lang=eng&id=#p12#12" }
          }
        }
      }
    }
  ],
  "totalSize": 34,
  "nextPageToken": "ADMmFGNmVGNxMGNx0SY1cjYtIjZ4ITLwADMw0SZ1gDN1kDO2QiGBgpv6qJEGQ80EHKCMIBMxIgC"
}
```

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async searchScriptures(query, options = {}) {
  const params = new URLSearchParams({
    query: query,
    collectionName: options.collectionName || '*',
    bookTitle: options.bookTitle || '*',
    start: String(options.start || 1)
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?${params}`;
  
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
    
    // Transform to standard format
    return {
      results: data.results.map(result => {
        const fields = result.document.structData.fields;
        return {
          verseReference: fields.verse_reference.stringValue,
          content: fields.content.stringValue,
          collection: fields.collection_name.stringValue,
          book: fields.book_titles.stringValue,
          chapter: fields.chapter_name.stringValue,
          verseNumber: fields.verse_number.stringValue,
          type: fields.member_type.stringValue, // "verse" or "chapter header"
          url: fields.url.stringValue,
          isExactMatch: parseInt(result.document.derivedStructData.fields.is_exact_match_query.numberValue) === 1
        };
      }),
      pagination: {
        total: data.totalSize,
        nextPageToken: data.nextPageToken,
        start: options.start || 1
      },
      query: query,
      filters: {
        collection: options.collectionName,
        book: options.bookTitle
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

// Utility methods for scripture search
async searchScripturesByCollection(query, collectionName, options = {}) {
  return this.searchScriptures(query, {
    ...options,
    collectionName: collectionName
  });
}

async searchScripturesByBook(query, collectionName, bookTitle, options = {}) {
  return this.searchScriptures(query, {
    ...options,
    collectionName: collectionName,
    bookTitle: bookTitle
  });
}

// Get collection names for filtering
getScriptureCollections() {
  return [
    { name: 'The Old Testament', key: 'The Old Testament' },
    { name: 'The New Testament', key: 'The New Testament' },
    { name: 'The Book of Mormon', key: 'The Book of Mormon' },
    { name: 'Doctrine and Covenants', key: 'Doctrine and Covenants' },
    { name: 'The Pearl of Great Price', key: 'The Pearl of Great Price' }
  ];
}
```

### MCP Tool Integration
```javascript
// Add scripture search tool to working-server.js
async function handleSearchScriptures(args, messageId) {
  const { query, collectionName = '*', bookTitle = '*', limit = 20, offset = 0 } = args;
  
  try {
    const searchResponse = await gospelLibraryClient.searchScriptures(query, {
      collectionName: collectionName === 'all' ? '*' : collectionName,
      bookTitle: bookTitle === 'all' ? '*' : bookTitle,
      start: offset + 1
    });
    
    if (searchResponse.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Error searching scriptures: ${searchResponse.error.message}`
          }]
        }
      });
      return;
    }

    let resultText = `# Scripture Search Results for "${query}"\\n\\n`;
    
    if (collectionName !== '*' && collectionName !== 'all') {
      resultText += `**Collection:** ${collectionName}\\n`;
    }
    if (bookTitle !== '*' && bookTitle !== 'all') {
      resultText += `**Book:** ${bookTitle}\\n`;
    }
    
    resultText += `Found ${searchResponse.pagination.total} total results:\\n\\n`;

    searchResponse.results.slice(0, limit).forEach((result, index) => {
      const verseInfo = result.verseNumber === '0' ? 'Chapter Header' : `Verse ${result.verseNumber}`;
      
      resultText += `## ${index + 1}. ${result.verseReference} (${verseInfo})\\n`;
      resultText += `**Collection:** ${result.collection}\\n`;
      resultText += `**Book:** ${result.book}\\n`;
      if (result.isExactMatch) {
        resultText += `**Match Type:** Exact Match\\n`;
      }
      resultText += `**Content:** ${result.content}\\n`;
      resultText += `**URL:** ${result.url}\\n\\n`;
    });
    
    if (searchResponse.pagination.nextPageToken) {
      resultText += `*Use offset ${offset + limit} to get next page of results*\\n`;
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
  name: "search_scriptures",
  description: "Search within scripture text at verse-level granularity",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query text (use quotes for exact phrases)"
      },
      collectionName: {
        type: "string",
        description: "Scripture collection filter",
        enum: ["all", "The Old Testament", "The New Testament", "The Book of Mormon", "Doctrine and Covenants", "The Pearl of Great Price"],
        default: "all"
      },
      bookTitle: {
        type: "string",
        description: "Specific book name filter (e.g., 'Isaiah', 'Alma') or 'all'",
        default: "all"
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

### Test Cases
```javascript
// Test 1: Basic search across all scriptures
GET https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?query="RESTORATION"&collectionName=*&bookTitle=*&start=1

// Test 2: Search within specific collection
GET https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?query="RESTORATION"&collectionName=The%20Old%20Testament&bookTitle=*&start=1

// Test 3: Search within specific book
GET https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?query="RESTORATION"&collectionName=The%20Old%20Testament&bookTitle=Isaiah&start=1

// Test 4: Pagination
GET https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?query="love"&collectionName=*&bookTitle=*&start=11
```

### cURL Testing Commands
```bash
# Basic scripture search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?query=%22RESTORATION%22&collectionName=*&bookTitle=*&start=1"

# Search within Old Testament
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?query=%22RESTORATION%22&collectionName=The%20Old%20Testament&bookTitle=*&start=1"

# Search within specific book
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?query=%22RESTORATION%22&collectionName=The%20Old%20Testament&bookTitle=Isaiah&start=1"
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| URL encoding | Special characters in query break request | Properly URL-encode query parameters |
| Collection name mismatch | No results with valid collection | Use exact collection names: "The Old Testament", "The Book of Mormon", etc. |
| Book name variations | No results for valid book | Use canonical book names from scripture books endpoint |
| Large result sets | Slow response | Use pagination with reasonable page sizes (20-50 results) |

## Collection and Book Filtering

### Valid Collection Names
- `"*"` - All collections
- `"The Old Testament"` - 39 books (Genesis → Malachi)
- `"The New Testament"` - 27 books (Matthew → Revelation)
- `"The Book of Mormon"` - 15 books (1 Nephi → Moroni)
- `"Doctrine and Covenants"` - D&C sections + Official Declarations
- `"The Pearl of Great Price"` - 5 books (Moses, Abraham, JS writings, Articles of Faith)

### Example Book Names by Collection
```javascript
// Old Testament books (examples)
bookTitle: "Genesis", "Isaiah", "Psalms", "Malachi"

// New Testament books (examples)  
bookTitle: "Matthew", "John", "Romans", "Revelation"

// Book of Mormon books (examples)
bookTitle: "1 Nephi", "Alma", "Helaman", "Moroni"

// Use the Scripture Books endpoint to get complete lists
```

### Collection Filtering Examples
```javascript
// Search all scriptures for "faith"
const results = await client.searchScriptures("faith");

// Search only Book of Mormon for "restoration"
const bofmResults = await client.searchScripturesByCollection("restoration", "The Book of Mormon");

// Search specific book for "love"
const almaResults = await client.searchScripturesByBook("love", "The Book of Mormon", "Alma");
```

## Usage Examples

### Exact Phrase Scripture Searches
```javascript
// Search for exact doctrinal phrases
const planSalvation = await client.searchScriptures('"plan of salvation"', {
  collectionName: "*"  // Search all collections
});

// Search for specific scriptural quotations
const faithHope = await client.searchScriptures('"faith is the substance"', {
  collectionName: "The New Testament"
});

// Search for exact terms in specific books
const straitGate = await client.searchScriptures('"strait is the gate"', {
  collectionName: "The New Testament",
  bookTitle: "Matthew"
});

// Search for proper names or places
const zarahemla = await client.searchScriptures('"Zarahemla"', {
  collectionName: "The Book of Mormon"
});
```

### Fuzzy/Broad Scripture Searches
```javascript
// Broad thematic study - finds various forms and related concepts
const faithStudy = await client.searchScriptures('faith hope charity', {
  collectionName: "The Book of Mormon"
});

// Concept exploration across multiple terms
const atonementStudy = await client.searchScriptures('atonement sacrifice redemption', {
  collectionName: "*"
});

// Single concept with variations
const prayerStudy = await client.searchScriptures('prayer', {
  collectionName: "The Book of Mormon"  // Finds "prayer", "pray", "prayed", "prayers"
});

// Temple and worship themes
const templeStudy = await client.searchScriptures('temple worship ordinances', {
  collectionName: "Doctrine and Covenants"
});
```

### Collection-Specific Comparative Searches
```javascript
// Compare how different collections address the same theme
const loveOT = await client.searchScriptures('love', { 
  collectionName: "The Old Testament" 
});

const loveNT = await client.searchScriptures('love', { 
  collectionName: "The New Testament" 
});

const loveBofM = await client.searchScriptures('love', { 
  collectionName: "The Book of Mormon" 
});

// Compare exact phrases across collections
const goldenRuleNT = await client.searchScriptures('"do unto others"', {
  collectionName: "The New Testament"
});

const goldenRuleBofM = await client.searchScriptures('"do unto others"', {
  collectionName: "The Book of Mormon"  
});
```

### Book-Specific Comparative Searches
```javascript
// Compare creation accounts with exact phrases
const genesisCreation = await client.searchScriptures('"in the beginning"', { 
  collectionName: "The Old Testament", 
  bookTitle: "Genesis" 
});

const mosesCreation = await client.searchScriptures('"in the beginning"', { 
  collectionName: "The Pearl of Great Price", 
  bookTitle: "Moses" 
});

// Compare broad themes in specific books
const isaiahFaith = await client.searchScriptures('faith trust Lord', {
  collectionName: "The Old Testament",
  bookTitle: "Isaiah"
});

const psalmsFaith = await client.searchScriptures('faith trust Lord', {
  collectionName: "The Old Testament", 
  bookTitle: "Psalms"
});
```

### Advanced Topic Research
```javascript
// Multi-faceted doctrinal study with broad terms
const doctrinalStudy = await client.searchScriptures('priesthood authority keys', {
  collectionName: "Doctrine and Covenants"
});

// Historical event study with specific terms
const restorationEvents = await client.searchScriptures('restoration church authority', {
  collectionName: "Doctrine and Covenants"
});

// Prophetic study comparing similar themes
const secondComingMT = await client.searchScriptures('second coming signs', {
  collectionName: "The New Testament",
  bookTitle: "Matthew"
});

const secondComingDC = await client.searchScriptures('second coming signs', {
  collectionName: "Doctrine and Covenants"
});
```

## Result Types

### Verses vs Chapter Headers
Results include two types of content:

**Verses**: Individual scripture verses
- `verse_number`: Specific verse number (e.g., "12")
- `member_type`: "verse"
- `url`: Links directly to verse with anchor (e.g., `#p12#12`)

**Chapter Headers**: Chapter introductions and summaries
- `verse_number`: "0" 
- `member_type`: "chapter header"
- `url`: Links to chapter overview

### Exact vs Contextual Matches
- `isExactMatch: true`: Query terms appear exactly as searched
- `isExactMatch: false`: Contextual or related matches based on relevance

## Notes

- This endpoint searches **verse-level content** including both verse text and chapter headers
- Results include both **exact matches** and **contextual matches** (indicated by `is_exact_match_query` field)
- **Chapter headers** have `verse_number: "0"` and `member_type: "chapter header"`
- **Individual verses** have specific verse numbers and `member_type: "verse"`
- URLs point directly to specific verses with anchor links (e.g., `#p12#12` for verse 12)
- **Exact phrase search** supported with double quotes: `"restoration of the gospel"`
- Results are ranked by relevance within the Vertex AI search infrastructure
- **Pagination** uses 1-based indexing (start=1 for first page, start=11 for second page of 10 results)
- **Collection filtering** significantly narrows results (34 total vs 6 in Old Testament for "RESTORATION")
- **Book filtering** provides the most specific results (4 results when limited to Isaiah)

## Related Documentation

- [Scripture Books](scripture-books.md) - Get complete lists of scripture books and collections
- [General Conference Search](general-conference-search.md) - Search conference talks with similar filtering
- [Vertex Search](vertex-search.md) - Multi-type search across all Gospel Library content