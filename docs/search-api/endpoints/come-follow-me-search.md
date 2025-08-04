# Come, Follow Me Search: `/search/proxy/vertex-search` (Manual Filter)

Specialized search within Come, Follow Me study materials using Google Vertex AI Search with manual-specific filtering.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search within Come, Follow Me study materials, lessons, and resources

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
// Search for specific lesson topics
q: '"covenant path"'           // Finds exact phrase in CFM materials
q: '"ministering"'             // Finds specific doctrinal terms
q: '"Joseph Smith"'            // Finds prophet-specific content
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
// Broad topic exploration
q: 'covenant path discipleship'    // Finds related concepts
q: 'family home evening'          // Finds implementation guidance
q: 'testimony building'           // Finds spiritual development content
```

## Parameters

### Required Parameters
```typescript
interface ComeFollowMeSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Manual-specific filter expression
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Structure
The filter parameter includes:
- **Manual Restriction**: `siteSearch:"churchofjesuschrist.org/study/manual/come-follow-me*"`
- **Language Filtering**: `(siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")`
- **Standard Exclusions**: Removes ads, tracking, and other non-content URLs

### Example Request
```javascript
const params = new URLSearchParams({
  q: 'RESTORATION',
  start: '1',
  searchType: 'web',
  filter: 'siteSearch:"churchofjesuschrist.org/study/manual/come-follow-me*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"',
  orderBy: ''
});
```

## Response Format

The response follows the standard Google Vertex AI Search format (same as [vertex-search.md](vertex-search.md)).

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async searchComeFollowMe(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    start: options.start || 1,
    searchType: 'web',
    filter: 'siteSearch:"churchofjesuschrist.org/study/manual/come-follow-me*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"',
    orderBy: options.orderBy || ''
  });
  
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
    
    // Transform to consistent format
    return {
      results: data.results.map(result => {
        const fields = result.document.derivedStructData.fields;
        return {
          uri: this.extractUri(fields.link.stringValue),
          title: fields.title.stringValue,
          snippet: this.extractSnippet(fields.snippets),
          link: fields.link.stringValue,
          displayLink: fields.displayLink.stringValue,
          contentType: 'come-follow-me',
          metadata: {
            displayLink: fields.displayLink?.stringValue,
            canFetchContent: fields.can_fetch_raw_content?.stringValue === "true"
          }
        };
      }),
      pagination: {
        total: data.totalSize,
        nextPageToken: data.nextPageToken,
        start: options.start || 1
      },
      searchType: 'come-follow-me'
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
```

### MCP Tool Integration
```javascript
// Add Come, Follow Me search tool
{
  name: "search_come_follow_me",
  description: "Search within Come, Follow Me study materials and lessons",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query text (use quotes for exact phrases)"
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 20)",
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

// Tool handler
async function handleSearchComeFollowMe(args, messageId) {
  const { query, limit = 20, offset = 0 } = args;
  
  try {
    const searchResponse = await gospelLibraryClient.searchComeFollowMe(query, {
      start: offset + 1
    });
    
    if (searchResponse.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Error searching Come, Follow Me: ${searchResponse.error.message}`
          }]
        }
      });
      return;
    }

    let resultText = `# Come, Follow Me Search Results for "${query}"\n\n`;
    resultText += `Found ${searchResponse.pagination.total} total results:\n\n`;

    searchResponse.results.slice(0, limit).forEach((result, index) => {
      resultText += `## ${index + 1}. ${result.title}\n`;
      resultText += `**URI:** ${result.uri}\n`;
      resultText += `**Link:** ${result.link}\n`;
      if (result.snippet) {
        resultText += `**Snippet:** ${result.snippet}\n`;
      }
      resultText += `\n`;
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
```

## Usage Examples

### Lesson Planning
```javascript
// Find specific doctrinal topics for lesson preparation
const covenantPath = await client.searchComeFollowMe('"covenant path"');
const discipleship = await client.searchComeFollowMe('discipleship following Christ');

// Search for implementation guidance
const familyStudy = await client.searchComeFollowMe('family home evening study');
const youthActivities = await client.searchComeFollowMe('youth activities engagement');
```

### Weekly Study Preparation
```javascript
// Prepare for upcoming lessons
const currentWeek = await client.searchComeFollowMe('2024 January week 1');
const scriptureContext = await client.searchComeFollowMe('1 Nephi context background');

// Find supplementary materials
const mediaResources = await client.searchComeFollowMe('videos activities games');
const discussions = await client.searchComeFollowMe('discussion questions families');
```

### Teaching Enhancement
```javascript
// Find teaching approaches
const teachingMethods = await client.searchComeFollowMe('teach children gospel');
const applicationIdeas = await client.searchComeFollowMe('apply principles daily life');

// Search for specific age groups
const youthGuidance = await client.searchComeFollowMe('teenagers young adults');
const childrenActivities = await client.searchComeFollowMe('children primary activities');
```

### Personal Study
```javascript
// Deepen understanding of concepts
const personalRevelation = await client.searchComeFollowMe('"personal revelation"');
const spiritualGrowth = await client.searchComeFollowMe('spiritual growth development');

// Find application examples
const modernApplication = await client.searchComeFollowMe('modern examples application');
const dailyLiving = await client.searchComeFollowMe('daily living gospel principles');
```

## Testing Information

### cURL Testing Commands
```bash
# Basic Come, Follow Me search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fmanual%2Fcome-follow-me*%22%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)%20AND%20-siteSearch%3A%22*imageView%3D*%22&orderBy="

# Search with pagination
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=faith&start=21&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fmanual%2Fcome-follow-me*%22%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)&orderBy="
```

## Content Coverage

### Come, Follow Me Materials Include:
- **Weekly lesson outlines** and objectives
- **Scripture study guides** with context and commentary
- **Family study suggestions** and activities
- **Personal application** exercises and reflection questions
- **Teaching resources** for parents and leaders
- **Multimedia recommendations** (videos, music, images)
- **Cross-references** to other gospel resources
- **Historical and cultural context** for scripture passages

### Typical Result Types:
- Lesson outlines for specific weeks/months
- Doctrinal explanations and commentary
- Activity suggestions and implementation guides
- Discussion questions and family conversation starters
- Background information and historical context
- Application examples and modern-day relevance

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| No results for recent content | Empty results for current year | Content may not be indexed yet, try broader terms |
| Overly specific searches | No results for exact lesson titles | Use broader topic terms rather than specific titles |
| Mixed language results | Results in multiple languages | Filter is already set for English, check query terms |

## Notes

- **Manual Focus**: Specifically searches Come, Follow Me study materials
- **Comprehensive Coverage**: Includes all CFM resources (individual, family, teaching)
- **Current Content**: Includes the most recent CFM materials and updates
- **Multi-format Results**: Finds lesson outlines, activities, discussion guides, and resources
- **Teaching Support**: Excellent for lesson preparation and family study planning
- **Cross-referenced**: Results often link to related scriptures and general conference talks
- **Implementation Focused**: Emphasizes practical application and personal study
- **Family Oriented**: Strong emphasis on family study and home-centered learning

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [General Conference Search](general-conference-search.md) - Complementary conference content
- [Scripture Search](scripture-search.md) - Scripture context for CFM lessons
- [Books & Lessons Search](books-lessons-search.md) - Broader manual search capabilities