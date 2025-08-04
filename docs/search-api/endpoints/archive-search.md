# Archive Search Endpoint

## Overview
The Archive Search endpoint provides comprehensive search functionality across all Gospel Library content collections, including scriptures, general conference talks, magazines, media, and lesson materials. This endpoint serves as the primary search interface for the Church's archived content.

## Endpoint Details
- **URL**: `https://www.churchofjesuschrist.org/search/proxy/content-search-service`
- **Method**: GET
- **Purpose**: Search across all Church content collections with advanced filtering options
- **Type**: Archive/Legacy content search

## Companion Endpoint
- **URL**: `https://www.churchofjesuschrist.org/search/proxy/getArchiveSearchStrings`
- **Purpose**: Retrieve all available filter values, date ranges, sources, authors, and localized strings

## Parameters

### Required Parameters
- `query` (string): Search term or phrase
- `page` (number): Page number (1-based pagination)
- `lang` (string): Language code (e.g., "eng")

### Optional Filtering Parameters
- `source` (number): Content source ID (see Sources section)
- `author` (string): Speaker/author slug (e.g., "russell-m-nelson")
- `dateRange` (string): Predefined date range or "custom-date-range"
- `beginDate` (string): Custom start date (YYYY-MM-DD format)
- `endDate` (string): Custom end date (YYYY-MM-DD format)
- `sort` (string): Sort order ("book" for scriptures, "relevance" default)
- `book` (number): Scripture book filter (when source=48)

## Sources and IDs

### Primary Sources
- `47` - General Conference
- `48` - Scriptures
- `46` - Magazines  
- `44` - Media
- `60` - Hymns for Home and Church
- `43` - Callings
- `45` - Other

### Scripture Books (when source=48)
- `73` - Book of Mormon
- `74` - Doctrine and Covenants
- `75` - New Testament
- `76` - Old Testament
- `77` - Pearl of Great Price

### Magazine Subcategories (when source=46)
- `54` - Friend
- `55` - For the Strength of Youth
- `57` - Liahona
- `78` - YA Weekly

## Date Range Options
- `any-date` - No date filtering
- `past-6-months` - Last 6 months
- `past-12-months` - Past year
- `past-5-years` - Past 5 years
- `past-10-years` - Past 10 years
- `2010-2019` - Decade ranges
- `2000-2009`
- `1990-1999`
- `1980-1989`
- `1970-1979`
- `custom-date-range` - Custom date range (requires beginDate/endDate)

## Example Requests

### Basic Search (All Collections)
```bash
curl "https://www.churchofjesuschrist.org/search/proxy/content-search-service?query=RESTORATION&page=1&lang=eng"
```

### General Conference by Speaker and Date
```bash
curl "https://www.churchofjesuschrist.org/search/proxy/content-search-service?query=RESTORATION&page=1&source=47&author=russell-m-nelson&dateRange=custom-date-range&beginDate=2000-01-04&endDate=2001-01-04&lang=eng"
```

### Scripture Search with Book Filter
```bash
curl "https://www.churchofjesuschrist.org/search/proxy/content-search-service?query=RESTORATION&page=1&source=48&sort=book&book=76&lang=eng"
```

### Magazine Search with Date Filter
```bash
curl "https://www.churchofjesuschrist.org/search/proxy/content-search-service?query=RESTORATION&page=1&source=46&dateRange=past-10-years&lang=eng"
```

## Response Format

```json
{
  "items": [
    {
      "link": "https://churchofjesuschrist.org/study/manual/revelations-in-context/restoring-the-ancient-order",
      "title": "Restoring the Ancient Order",
      "subtitle": "Revelations in Context",
      "htmlSnippet": "...<b>Restoring</b> the Ancient Order D&C 102, 107 Joseph F. Darowski..."
    }
  ],
  "searchInformation": {
    "totalResults": 1745
  },
  "spellCheck": {
    "checkUserSpelling": true,
    "spellingChanged": false,
    "skipCache": false,
    "originalResultsEmpty": false,
    "spellCheckedResultsEmpty": false,
    "display": "RESTORATION",
    "spellCheckedQuery": "",
    "originalQuery": "RESTORATION"
  }
}
```

## MCP Tool Integration

### Tool Definition
```typescript
const archiveSearchTool = {
  name: "search_archive",
  description: "Search Church archive content with advanced filtering options",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search term or phrase"
      },
      source: {
        type: "number",
        description: "Content source ID (47=Conference, 48=Scriptures, 46=Magazines, etc.)"
      },
      author: {
        type: "string", 
        description: "Speaker/author slug (e.g., 'russell-m-nelson')"
      },
      dateRange: {
        type: "string",
        description: "Date range filter or 'custom-date-range'"
      },
      beginDate: {
        type: "string",
        description: "Custom start date (YYYY-MM-DD)"
      },
      endDate: {
        type: "string", 
        description: "Custom end date (YYYY-MM-DD)"
      },
      sort: {
        type: "string",
        description: "Sort order ('book' for scriptures, 'relevance' default)"
      },
      book: {
        type: "number",
        description: "Scripture book filter (73=BoM, 74=D&C, 75=NT, 76=OT, 77=PoGP)"
      },
      page: {
        type: "number",
        description: "Page number (default: 1)"
      }
    },
    required: ["query"]
  }
};
```

### Tool Handler
```typescript
async function handleArchiveSearch(args: any) {
  const params = new URLSearchParams({
    query: args.query,
    page: (args.page || 1).toString(),
    lang: 'eng'
  });
  
  // Add optional filters
  if (args.source) params.append('source', args.source.toString());
  if (args.author) params.append('author', args.author);
  if (args.dateRange) params.append('dateRange', args.dateRange);
  if (args.beginDate) params.append('beginDate', args.beginDate);
  if (args.endDate) params.append('endDate', args.endDate);
  if (args.sort) params.append('sort', args.sort);
  if (args.book) params.append('book', args.book.toString());
  
  const response = await fetch(`https://www.churchofjesuschrist.org/search/proxy/content-search-service?${params}`);
  const data = await response.json();
  
  return {
    content: [{
      type: "text",
      text: `Found ${data.searchInformation?.totalResults || 0} results for "${args.query}"\n\n` +
            data.items?.map((item: any) => 
              `**${item.title}**\n${item.subtitle}\n${item.link}\n${item.htmlSnippet}\n`
            ).join('\n') || 'No results found'
    }]
  };
}
```

## JavaScript Integration

### Basic Search Function
```javascript
async function searchArchive(query, options = {}) {
  const params = new URLSearchParams({
    query,
    page: options.page || 1,
    lang: options.lang || 'eng'
  });
  
  // Add optional parameters
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && key !== 'page' && key !== 'lang') {
      params.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://www.churchofjesuschrist.org/search/proxy/content-search-service?${params}`);
  return response.json();
}
```

### Usage Examples
```javascript
// Search all content
const allResults = await searchArchive('restoration');

// Search General Conference talks by speaker
const conferenceResults = await searchArchive('restoration', {
  source: 47,
  author: 'russell-m-nelson',
  dateRange: 'past-10-years'
});

// Search scriptures with book filter and sort
const scriptureResults = await searchArchive('faith', {
  source: 48,
  book: 76, // Old Testament
  sort: 'book'
});

// Custom date range search
const customResults = await searchArchive('prayer', {
  source: 47,
  dateRange: 'custom-date-range',
  beginDate: '2020-01-01',
  endDate: '2024-12-31'
});
```

## Filter Configuration Retrieval

### Get Available Filters
```javascript
async function getArchiveFilters(lang = 'eng') {
  const response = await fetch(`https://www.churchofjesuschrist.org/search/proxy/getArchiveSearchStrings?lang=${lang}&isPreview=false`);
  const data = await response.json();
  
  return {
    sources: data.sources,
    authors: data.authors,
    dates: data.dates,
    books: data.books,
    strings: data.strings // Localized UI strings
  };
}
```

## Testing with MCP Inspector

```bash
npm run inspect
```

Test queries in the inspector:
```json
{
  "query": "restoration",
  "source": 47,
  "author": "russell-m-nelson", 
  "dateRange": "past-10-years"
}
```

## Key Features

1. **Comprehensive Coverage**: Searches across all major Church content collections
2. **Advanced Filtering**: Source, author, date, and content-specific filters
3. **Flexible Dating**: Predefined ranges and custom date ranges
4. **Content-Specific Options**: Book sorting for scriptures, speaker filtering for conference
5. **Rich Results**: HTML snippets with search term highlighting
6. **Spell Checking**: Built-in spell check and query correction
7. **Pagination**: 1-based pagination with total result counts
8. **Localization**: Multi-language support with localized filter strings

## Notes

- Uses 1-based pagination (page=1 for first page)
- Search terms are highlighted in HTML snippets with `<b>` tags
- Custom date ranges require both beginDate and endDate parameters
- Scripture searches can be sorted by book order or relevance
- The companion endpoint provides all available filter values and localized strings
- Results include direct links to the full content on churchofjesuschrist.org