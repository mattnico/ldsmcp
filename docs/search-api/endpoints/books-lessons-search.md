# Books & Lessons Search: `/search/proxy/vertex-search` (Manual Filter)

Comprehensive search across all Gospel Library study manuals, lesson materials, and educational resources.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search across all Church study manuals, lesson materials, and educational resources

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
q: '"Gospel Principles"'           // Finds specific manual titles
q: '"Preach My Gospel"'            // Finds exact lesson material names
q: '"seminary manual"'             // Finds specific educational resources
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
q: 'teaching methods principles'    // Finds various teaching resources
q: 'leadership training'           // Finds leadership development materials
q: 'family study activities'      // Finds family-oriented resources
```

## Parameters

### Required Parameters
```typescript
interface BooksLessonsSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Manual directory filter expression
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Structure
- **Manual Directory**: `siteSearch:"churchofjesuschrist.org/study/manual"`
- **Language Filtering**: `(siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")`
- **Standard Exclusions**: Removes non-content URLs

## Code Integration

### JavaScript Implementation
```javascript
async searchBooksAndLessons(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    start: options.start || 1,
    searchType: 'web',
    filter: 'siteSearch:"churchofjesuschrist.org/study/manual" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"',
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
          contentType: 'books-lessons',
          metadata: {
            manual: this.extractManual(fields.link.stringValue),
            displayLink: fields.displayLink?.stringValue
          }
        };
      }),
      pagination: { total: data.totalSize, nextPageToken: data.nextPageToken, start: options.start || 1 },
      searchType: 'books-lessons'
    };
  } catch (error) {
    return { error: { message: error.message, code: 'FETCH_ERROR' } };
  }
}

extractManual(url) {
  const manualMatch = url.match(/\/manual\/([^\/]+)/);
  return manualMatch ? manualMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
}
```

## Usage Examples

### Teaching Resources
```javascript
const teachingMethods = await client.searchBooksAndLessons('"Teaching in the Savior\'s Way"');
const lessonPlanning = await client.searchBooksAndLessons('lesson preparation activities');
```

### Study Manuals
```javascript
const gospelPrinciples = await client.searchBooksAndLessons('"Gospel Principles" doctrine');
const preachMyGospel = await client.searchBooksAndLessons('"Preach My Gospel" missionary');
```

### Leadership Training
```javascript
const leadership = await client.searchBooksAndLessons('leadership training development');
const administration = await client.searchBooksAndLessons('organization administration');
```

## Content Coverage

### Manual Categories Include:
- **Doctrine and Study**: Gospel Principles, Doctrinal Mastery, etc.
- **Missionary Work**: Preach My Gospel, missionary training materials
- **Leadership Development**: Leadership handbooks and training resources
- **Teaching Resources**: Teaching guides and methodologies
- **Seminary/Institute**: Educational curricula and study guides
- **Family Resources**: Family study materials and activities
- **Historical Materials**: Church history and biographical resources
- **Specialized Programs**: Language learning, self-reliance, etc.

## Notes

- **Comprehensive Coverage**: All Gospel Library study manuals and lesson materials
- **Educational Focus**: Emphasizes learning, teaching, and personal development
- **Multi-Audience**: Content for members, leaders, missionaries, and educators
- **Practical Application**: Focuses on implementation and real-world use
- **Cross-Referenced**: Links to related scriptures and conference talks
- **Regular Updates**: Includes current and historical educational materials

## Related Documentation

- [Come Follow Me Search](come-follow-me-search.md) - Specific CFM materials (subset of this search)
- [General Handbook Search](general-handbook-search.md) - Administrative guidance complement
- [Vertex Search](vertex-search.md) - Base endpoint documentation