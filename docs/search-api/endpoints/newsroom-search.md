# Church Newsroom Search: `/search/proxy/newsroom-search`

Specialized search across global Church newsroom sites with date filtering and multi-regional coverage.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/newsroom-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search across Church newsroom content from multiple international regions with date filtering

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
// Search for specific events or announcements
q: '"temple dedication"'           // Finds exact event coverage
q: '"general conference"'          // Finds conference-related news
q: '"humanitarian aid"'            // Finds exact program names
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
// Broad news topic exploration
q: 'temple construction'           // Finds various temple-related news
q: 'missionary work expansion'     // Finds mission-related coverage
q: 'community service projects'    // Finds service-related stories
```

## Parameters

### Required Parameters
```typescript
interface NewsroomSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Multi-regional and date filter expression
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Structure
The filter includes multiple components:
- **Multi-Regional Sites**: Covers 20+ international Church newsroom sites
- **Date Range Filtering**: `datePublished >= "YYYY-MM-DDTHH:MM:SS.000Z"`
- **Language Filtering**: `(siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")`
- **Standard Exclusions**: Removes ads, tracking, and other non-content URLs

### Regional Newsroom Sites Covered
```javascript
const newsroomSites = [
  'newsroom.churchofjesuschrist.org',          // Global/US
  'news-africa.churchofjesuschrist.org',       // Africa
  'news-au.churchofjesuschrist.org',           // Australia
  'news-bb.churchofjesuschrist.org',           // Barbados/Caribbean
  'news-bz.churchofjesuschrist.org',           // Belize
  'news-kh.churchofjesuschrist.org',           // Cambodia
  'news-ca.churchofjesuschrist.org',           // Canada
  'news-gh.churchofjesuschrist.org',           // Ghana
  'news-gu.churchofjesuschrist.org',           // Guatemala
  'news-hk.churchofjesuschrist.org/eng',       // Hong Kong
  'news-in.churchofjesuschrist.org',           // India
  'news-ie.churchofjesuschrist.org',           // Ireland
  'news-jm.churchofjesuschrist.org',           // Jamaica
  'news-ke.churchofjesuschrist.org',           // Kenya
  'news-my.churchofjesuschrist.org',           // Malaysia
  'news-middleeast.churchofjesuschrist.org',   // Middle East
  'news-nz.churchofjesuschrist.org',           // New Zealand
  'news-ng.churchofjesuschrist.org',           // Nigeria
  'news-pg.churchofjesuschrist.org',           // Papua New Guinea
  'news-ph.churchofjesuschrist.org',           // Philippines
  'news-sl.churchofjesuschrist.org',           // Sierra Leone
  'news-sg.churchofjesuschrist.org',           // Singapore
  'news-za.churchofjesuschrist.org',           // South Africa
  'news-ug.churchofjesuschrist.org',           // Uganda
  'news-uk.churchofjesuschrist.org',           // United Kingdom
  'news-zw.churchofjesuschrist.org'            // Zimbabwe
];
```

### Date Range Examples
```javascript
// Last 5 years (2020-2025)
'datePublished >= "2020-01-01T07:00:00.000Z" AND datePublished <= "2026-01-01T06:59:59.000Z"'

// Specific decade (2010-2019)
'datePublished >= "2010-01-01T07:00:00.000Z" AND datePublished <= "2020-01-01T06:59:59.000Z"'

// Current year
'datePublished >= "2024-01-01T07:00:00.000Z" AND datePublished <= "2025-01-01T06:59:59.000Z"'
```

## Response Format

The response follows the standard Google Vertex AI Search format (same as [vertex-search.md](vertex-search.md)) with additional date metadata.

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async searchNewsroom(query, options = {}) {
  // Default to last 5 years if no date range specified
  const defaultStartDate = options.startDate || '2020-01-01T07:00:00.000Z';
  const defaultEndDate = options.endDate || '2026-01-01T06:59:59.000Z';
  
  // Build regional sites filter
  const newsroomSites = [
    'newsroom.churchofjesuschrist.org',
    'news-africa.churchofjesuschrist.org',
    'news-au.churchofjesuschrist.org',
    'news-bb.churchofjesuschrist.org',
    'news-bz.churchofjesuschrist.org',
    'news-kh.churchofjesuschrist.org',
    'news-ca.churchofjesuschrist.org',
    'news-gh.churchofjesuschrist.org',
    'news-gu.churchofjesuschrist.org',
    'news-hk.churchofjesuschrist.org/eng',
    'news-in.churchofjesuschrist.org',
    'news-ie.churchofjesuschrist.org',
    'news-jm.churchofjesuschrist.org',
    'news-ke.churchofjesuschrist.org',
    'news-my.churchofjesuschrist.org',
    'news-middleeast.churchofjesuschrist.org',
    'news-nz.churchofjesuschrist.org',
    'news-ng.churchofjesuschrist.org',
    'news-pg.churchofjesuschrist.org',
    'news-ph.churchofjesuschrist.org',
    'news-sl.churchofjesuschrist.org',
    'news-sg.churchofjesuschrist.org',
    'news-za.churchofjesuschrist.org',
    'news-ug.churchofjesuschrist.org',
    'news-uk.churchofjesuschrist.org',
    'news-zw.churchofjesuschrist.org'
  ];
  
  const siteFilters = newsroomSites.map(site => `siteSearch:"${site}"`).join(' OR ');
  
  const filter = `(${siteFilters}) AND datePublished >= "${defaultStartDate}" AND datePublished <= "${defaultEndDate}" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"`;
  
  const params = new URLSearchParams({
    q: query,
    start: options.start || 1,
    searchType: 'web',
    filter: filter,
    orderBy: options.orderBy || ''
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/newsroom-search?${params}`;
  
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
          contentType: 'newsroom',
          datePublished: fields.datePublished ? new Date(fields.datePublished.numberValue / 1000) : null,
          metadata: {
            displayLink: fields.displayLink?.stringValue,
            datePublished: fields.datePublished?.numberValue,
            region: this.extractRegion(fields.link.stringValue),
            canFetchContent: fields.can_fetch_raw_content?.stringValue === "true"
          }
        };
      }),
      pagination: {
        total: data.totalSize,
        nextPageToken: data.nextPageToken,
        start: options.start || 1
      },
      searchType: 'newsroom',
      dateRange: {
        start: defaultStartDate,
        end: defaultEndDate
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

// Utility to extract region from newsroom URL
extractRegion(url) {
  const regionMatches = url.match(/news-([a-z]+)\.churchofjesuschrist\.org/);
  if (regionMatches) {
    const regionCodes = {
      'africa': 'Africa',
      'au': 'Australia', 
      'bb': 'Barbados/Caribbean',
      'bz': 'Belize',
      'kh': 'Cambodia',
      'ca': 'Canada',
      'gh': 'Ghana',
      'gu': 'Guatemala',
      'hk': 'Hong Kong',
      'in': 'India',
      'ie': 'Ireland',
      'jm': 'Jamaica',
      'ke': 'Kenya',
      'my': 'Malaysia',
      'middleeast': 'Middle East',
      'nz': 'New Zealand',
      'ng': 'Nigeria',
      'pg': 'Papua New Guinea',
      'ph': 'Philippines',
      'sl': 'Sierra Leone',
      'sg': 'Singapore',
      'za': 'South Africa',
      'ug': 'Uganda',
      'uk': 'United Kingdom',
      'zw': 'Zimbabwe'
    };
    return regionCodes[regionMatches[1]] || regionMatches[1];
  }
  return url.includes('newsroom.churchofjesuschrist.org') ? 'Global/US' : 'Unknown';
}

// Convenience methods for date ranges
async searchNewsroomRecent(query, years = 5) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - years);
  
  return this.searchNewsroom(query, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
}

async searchNewsroomByYear(query, year) {
  const startDate = `${year}-01-01T00:00:00.000Z`;
  const endDate = `${year + 1}-01-01T00:00:00.000Z`;
  
  return this.searchNewsroom(query, {
    startDate,
    endDate
  });
}

async searchNewsroomByDecade(query, startYear, endYear) {
  const startDate = `${startYear}-01-01T00:00:00.000Z`;
  const endDate = `${endYear + 1}-01-01T00:00:00.000Z`;
  
  return this.searchNewsroom(query, {
    startDate,
    endDate
  });
}
```

### MCP Tool Integration
```javascript
// Add Newsroom search tool
{
  name: "search_newsroom",
  description: "Search Church newsroom content across global regions with date filtering",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query text (use quotes for exact phrases)"
      },
      startDate: {
        type: "string",
        description: "Start date in ISO format (default: 5 years ago)"
      },
      endDate: {
        type: "string", 
        description: "End date in ISO format (default: current date)"
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
async function handleSearchNewsroom(args, messageId) {
  const { query, startDate, endDate, limit = 20, offset = 0 } = args;
  
  try {
    const searchResponse = await gospelLibraryClient.searchNewsroom(query, {
      start: offset + 1,
      startDate,
      endDate
    });
    
    if (searchResponse.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Error searching newsroom: ${searchResponse.error.message}`
          }]
        }
      });
      return;
    }

    let resultText = `# Church Newsroom Search Results for "${query}"\n\n`;
    resultText += `Found ${searchResponse.pagination.total} total results`;
    if (searchResponse.dateRange) {
      const startYear = new Date(searchResponse.dateRange.start).getFullYear();
      const endYear = new Date(searchResponse.dateRange.end).getFullYear();
      resultText += ` (${startYear}-${endYear})`;
    }
    resultText += `:\n\n`;

    searchResponse.results.slice(0, limit).forEach((result, index) => {
      resultText += `## ${index + 1}. ${result.title}\n`;
      resultText += `**Region:** ${result.metadata.region}\n`;
      resultText += `**Published:** ${result.datePublished ? result.datePublished.toDateString() : 'Unknown'}\n`;
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

### Recent News and Announcements
```javascript
// Search recent Church news (last 5 years)
const recentNews = await client.searchNewsroom('"temple dedication"');
const announcements = await client.searchNewsroom('general conference announcements');

// Search for specific events
const covidResponse = await client.searchNewsroom('COVID-19 pandemic response');
const templesReopening = await client.searchNewsroom('temples reopening worship');
```

### Historical Research
```javascript
// Search specific decades
const decade2010s = await client.searchNewsroomByDecade('missionary age change', 2010, 2019);
const decade2000s = await client.searchNewsroomByDecade('temple construction', 2000, 2009);

// Search specific years
const year2020 = await client.searchNewsroomByYear('pandemic adjustments', 2020);
const year2015 = await client.searchNewsroomByYear('policy changes', 2015);
```

### Regional Coverage
```javascript
// Search for global Church growth
const globalGrowth = await client.searchNewsroom('membership growth statistics');
const internationalNews = await client.searchNewsroom('international temple announcements');

// Find region-specific coverage
const africanNews = await client.searchNewsroom('Africa temple construction');
const asianNews = await client.searchNewsroom('Asia missionary work expansion');
```

### Program and Initiative Coverage
```javascript
// Search humanitarian efforts
const humanitarian = await client.searchNewsroom('"humanitarian aid" disaster relief');
const charityWork = await client.searchNewsroom('community service projects');

// Search Church programs
const youthPrograms = await client.searchNewsroom('youth activities FSY camps');
const welfarePrograms = await client.searchNewsroom('welfare self-reliance programs');
```

## Testing Information

### cURL Testing Commands
```bash
# Recent news search (last 5 years)
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/newsroom-search?q=RESTORATION&searchType=web&start=1&filter=(siteSearch%3A%22newsroom.churchofjesuschrist.org%22)%20AND%20datePublished%20%3E%3D%20%222020-01-01T07%3A00%3A00.000Z%22%20AND%20datePublished%20%3C%3D%20%222026-01-01T06%3A59%3A59.000Z%22&orderBy="

# Historical search (2010-2019)
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/newsroom-search?q=temple%20dedication&searchType=web&start=1&filter=(siteSearch%3A%22newsroom.churchofjesuschrist.org%22)%20AND%20datePublished%20%3E%3D%20%222010-01-01T07%3A00%3A00.000Z%22%20AND%20datePublished%20%3C%3D%20%222020-01-01T06%3A59%3A59.000Z%22&orderBy="
```

## Content Coverage

### Newsroom Content Types:
- **News releases** and official announcements
- **Temple dedications** and groundbreaking ceremonies
- **General Conference** coverage and summaries
- **Humanitarian aid** and disaster response efforts
- **Missionary work** expansion and updates
- **Church growth** statistics and milestones
- **Leadership changes** and new appointments
- **Policy updates** and procedural changes
- **Community engagement** and interfaith initiatives
- **Cultural and educational** programs and events

### Regional Coverage Highlights:
- **Africa**: Rapid Church growth and temple construction
- **Asia-Pacific**: Missionary work expansion and cultural adaptation
- **Europe**: Interfaith cooperation and historical preservation
- **Latin America**: Community development and educational initiatives
- **North America**: Policy updates and program developments

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Too many results for broad terms | Overwhelming number of matches | Use more specific terms or narrow date range |
| Regional bias in results | Results favor certain regions | Include region-specific terms in query |
| Date filtering too restrictive | No results for historical events | Expand date range or use broader time periods |
| Language mixing in results | Results in multiple languages despite filter | Add more specific English language terms |

## Notes

- **Multi-Regional Coverage**: Searches across 25+ international Church newsroom sites
- **Date Filtering**: Essential for historical research and trend analysis
- **Official Source**: Authoritative Church news and announcements
- **Real-Time Updates**: Includes current news and recent developments
- **Global Perspective**: Shows Church growth and activities worldwide
- **Media-Rich Content**: Often includes photos, videos, and multimedia
- **Policy Documentation**: Records official Church positions and changes
- **Historical Archive**: Valuable for tracking Church development over time
- **Regional Insights**: Provides local context for global Church initiatives
- **Journalistic Standards**: Professional news coverage with verified information

## Related Documentation

- [Vertex Search](vertex-search.md) - Base search functionality
- [General Conference Search](general-conference-search.md) - Conference-related news coverage
- [Video Metadata](video-metadata.md) - News videos and multimedia content
- [General Handbook Search](general-handbook-search.md) - Policy context for news coverage