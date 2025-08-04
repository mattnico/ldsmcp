# Gospel Topics Search: `/search/proxy/vertex-search` (Topics Filter)

Search within Gospel Topics essays and questions for doctrinal explanations, answers to common questions, and scholarly perspectives on Church beliefs.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search within Gospel Topics for doctrinal clarification, scholarly essays, and answers to frequently asked questions

## Parameters

### Required Parameters
```typescript
interface GospelTopicsSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Gospel Topics directory filter
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Structure
```javascript
filter: 'siteSearch:"churchofjesuschrist.org/study/manual/gospel-topics" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*"'
```

## Code Integration

### JavaScript Implementation
```javascript
async searchGospelTopics(query, options = {}) {
  const filter = 'siteSearch:"churchofjesuschrist.org/study/manual/gospel-topics" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
  
  const params = new URLSearchParams({
    q: query,
    start: options.start || 1,
    searchType: 'web',
    filter: filter,
    orderBy: options.orderBy || ''
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-search?${params}`;
  
  return this._executeSearch(url, 'gospel-topics');
}
```

## Usage Examples

### Doctrinal Questions
```javascript
// Search for doctrinal clarifications
const godhead = await client.searchGospelTopics('"Godhead" Trinity "three persons"');
const salvation = await client.searchGospelTopics('salvation grace works faith');

// Historical topics
const polygamy = await client.searchGospelTopics('plural marriage polygamy historical');
const priesthood = await client.searchGospelTopics('"priesthood ban" race historical');
```

### Contemporary Issues
```javascript
// Modern applications
const familyProclamation = await client.searchGospelTopics('"family proclamation" marriage definition');
const womenPriesthood = await client.searchGospelTopics('women priesthood roles authority');
```

## Content Coverage

### Gospel Topics Categories:
- **Doctrinal Essays** - In-depth explanations of Church beliefs
- **Historical Topics** - Scholarly treatment of historical questions
- **Contemporary Issues** - Modern applications of gospel principles
- **Frequently Asked Questions** - Common inquiries about Church doctrine
- **Scholarly Perspectives** - Academic approaches to gospel topics

## Notes

- **Scholarly Approach**: Academic treatment of doctrinal and historical topics
- **FAQ Resource**: Answers to commonly asked questions about Church beliefs
- **Historical Context**: Provides background for complex historical issues
- **Doctrinal Clarity**: Official Church positions on important topics
- **Educational Tool**: Designed for teaching and learning purposes

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [Church History Search](church-history-search.md) - Historical context
- [General Handbook Search](general-handbook-search.md) - Policy context