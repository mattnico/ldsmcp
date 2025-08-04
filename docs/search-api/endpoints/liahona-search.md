# Liahona Search: `/search/proxy/vertex-search` (Magazine Filter)

Search within Liahona magazine content with optional year-based filtering for historical research.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search within Liahona magazine articles, stories, and content with year filtering

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
q: '"First Presidency message"'    // Finds specific article types
q: '"faith in every footstep"'     // Finds exact article titles
q: '"young adult"'                 // Finds demographic-specific content
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
q: 'testimony building faith'       // Finds thematic content
q: 'missionary experiences'        // Finds related stories and articles
q: 'family activities ideas'       // Finds practical family content
```

## Parameters

### Required Parameters
```typescript
interface LiahonaSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Liahona directory filter with optional year filtering
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Options

**All Years (Default)**
```javascript
filter: 'siteSearch:"churchofjesuschrist.org/study/liahona" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")'
```

**Specific Year Range (e.g., Last 10 Years)**
```javascript
filter: '(siteSearch:"churchofjesuschrist.org/study/liahona/2015/" OR siteSearch:"churchofjesuschrist.org/study/liahona/2016/" OR ... OR siteSearch:"churchofjesuschrist.org/study/liahona/2024/") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")'
```

## Code Integration

### JavaScript Implementation
```javascript
async searchLiahona(query, options = {}) {
  let filter;
  
  if (options.years && Array.isArray(options.years)) {
    // Filter by specific years
    const yearFilters = options.years.map(year => 
      `siteSearch:"churchofjesuschrist.org/study/liahona/${year}/"`
    ).join(' OR ');
    filter = `(${yearFilters}) AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*"`;
  } else if (options.yearRange) {
    // Filter by year range
    const { startYear, endYear } = options.yearRange;
    const yearFilters = [];
    for (let year = startYear; year <= endYear; year++) {
      yearFilters.push(`siteSearch:"churchofjesuschrist.org/study/liahona/${year}/"`);
    }
    filter = `(${yearFilters.join(' OR ')}) AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*"`;
  } else {
    // All years
    filter = 'siteSearch:"churchofjesuschrist.org/study/liahona" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*"';
  }
  
  const params = new URLSearchParams({
    q: query,
    start: options.start || 1,
    searchType: 'web',
    filter: filter,
    orderBy: options.orderBy || ''
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-search?${params}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { error: { message: `HTTP error! status: ${response.status}`, code: response.status.toString() } };
    }

    const data = await response.json();
    return {
      results: data.results.map(result => {
        const fields = result.document.derivedStructData.fields;
        return {
          uri: this.extractUri(fields.link.stringValue),
          title: fields.title.stringValue,
          snippet: this.extractSnippet(fields.snippets),
          link: fields.link.stringValue,
          contentType: 'liahona',
          metadata: {
            year: this.extractYear(fields.link.stringValue),
            month: this.extractMonth(fields.link.stringValue),
            displayLink: fields.displayLink?.stringValue
          }
        };
      }),
      pagination: { total: data.totalSize, nextPageToken: data.nextPageToken, start: options.start || 1 },
      searchType: 'liahona',
      filterInfo: options.years ? { years: options.years } : options.yearRange ? { yearRange: options.yearRange } : { scope: 'all-years' }
    };
  } catch (error) {
    return { error: { message: error.message, code: 'FETCH_ERROR' } };
  }
}

extractYear(url) {
  const yearMatch = url.match(/\/liahona\/(\d{4})\//);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

extractMonth(url) {
  const monthMatch = url.match(/\/liahona\/\d{4}\/(\d{2})\//);
  if (monthMatch) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(monthMatch[1]) - 1] || monthMatch[1];
  }
  return null;
}

// Convenience methods
async searchLiahonaRecent(query, years = 5) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years + 1;
  return this.searchLiahona(query, { yearRange: { startYear, endYear: currentYear } });
}

async searchLiahonaByYear(query, year) {
  return this.searchLiahona(query, { years: [year] });
}

async searchLiahonaByDecade(query, startYear, endYear) {
  return this.searchLiahona(query, { yearRange: { startYear, endYear } });
}
```

## Usage Examples

### Recent Articles
```javascript
// Search recent years (last 5 years)
const recentFaith = await client.searchLiahonaRecent('faith young adults', 5);
const recentFamily = await client.searchLiahonaRecent('"family home evening"', 3);
```

### Historical Research
```javascript
// Search specific decades
const decade2010s = await client.searchLiahonaByDecade('missionary work', 2010, 2019);
const decade2000s = await client.searchLiahonaByDecade('temple worship', 2000, 2009);

// Search specific years
const year2020 = await client.searchLiahonaByYear('pandemic adjustments', 2020);
const year2015 = await client.searchLiahonaByYear('family proclamation', 2015);
```

### Content Categories
```javascript
// First Presidency messages
const presidencyMessages = await client.searchLiahona('"First Presidency message"');

// Youth content
const youthArticles = await client.searchLiahona('youth teenagers young adults');

// Family content
const familyContent = await client.searchLiahona('family children parenting');

// Personal stories
const testimonies = await client.searchLiahona('testimony conversion personal story');
```

### Seasonal and Topical Searches
```javascript
// Holiday content
const christmas = await client.searchLiahona('Christmas nativity birth Christ');
const easter = await client.searchLiahona('Easter resurrection atonement');

// Conference follow-up
const conferenceInsights = await client.searchLiahona('general conference insights application');
```

## Content Coverage

### Liahona Article Types:
- **First Presidency Messages** - Monthly messages from Church leadership
- **Feature Articles** - In-depth doctrinal and inspirational content
- **Personal Stories** - Member testimonies and conversion accounts
- **Youth Content** - Articles specifically for teenagers and young adults
- **Family Features** - Parenting advice and family activity ideas
- **Church News** - Updates on Church growth and developments
- **Gospel Classics** - Reprints of timeless spiritual content
- **Local Spotlights** - Stories from members worldwide
- **Teaching Helps** - Resources for gospel instruction
- **Question and Answer** - Responses to common gospel questions

### Historical Coverage:
- **Digital Archive**: Articles from recent decades
- **Doctrinal Evolution**: Tracking how topics have been addressed over time
- **Cultural Context**: Articles reflecting changing cultural circumstances
- **Global Perspective**: International member experiences and insights

## Testing Information

### cURL Testing Commands
```bash
# Recent Liahona search (all years)
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fliahona%22%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)&orderBy="

# Last 10 years filter
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=faith&start=1&searchType=web&filter=(siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fliahona%2F2015%2F%22%20OR%20siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fliahona%2F2016%2F%22%20OR%20siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fliahona%2F2024%2F%22)&orderBy="
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Too narrow date range | No results for historical content | Expand year range or search all years |
| Overly broad searches | Too many unrelated results | Use more specific terms or narrow date range |
| Missing recent content | No results for current year | Content may not be indexed yet, try previous year |

## Notes

- **Magazine Focus**: Specifically searches Liahona magazine content
- **Historical Archive**: Valuable for tracking doctrinal emphasis over time
- **Global Perspective**: Includes international member stories and experiences
- **Inspirational Content**: Emphasizes personal application and spiritual growth
- **Family Oriented**: Strong emphasis on family life and relationships
- **Year Filtering**: Essential for historical research and trend analysis
- **Monthly Publications**: Organized by year and month for precise searching
- **Multi-Language Origin**: Originally published in multiple languages (English filter applied)
- **Member Stories**: Rich source of personal testimonies and conversion accounts
- **Leadership Messages**: Regular communication from Church leaders to members

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [General Conference Search](general-conference-search.md) - Complementary leadership content
- [Newsroom Search](newsroom-search.md) - Related Church news and updates
- [Books & Lessons Search](books-lessons-search.md) - Educational content complement