# Basic Beliefs Search: `/search/proxy/vertex-search` (Welcome Filter)

Search within the Church's welcome section for introductory content about basic beliefs, fundamental doctrines, and information for newcomers and investigators.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search introductory and welcome content for basic Church beliefs and fundamental doctrines

## Parameters

### Required Parameters
```typescript
interface BasicBeliefsSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Welcome section filter
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Structure
```javascript
filter: 'siteSearch:"www.churchofjesuschrist.org/welcome" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*"'
```

## Code Integration

### JavaScript Implementation
```javascript
async searchBasicBeliefs(query, options = {}) {
  const filter = 'siteSearch:"www.churchofjesuschrist.org/welcome" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
  
  const params = new URLSearchParams({
    q: query,
    start: options.start || 1,
    searchType: 'web',
    filter: filter,
    orderBy: options.orderBy || ''
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-search?${params}`;
  
  return this._executeSearch(url, 'basic-beliefs');
}
```

## Usage Examples

### Fundamental Doctrines
```javascript
// Core beliefs
const godhead = await client.searchBasicBeliefs('God Jesus Christ Holy Ghost');
const salvation = await client.searchBasicBeliefs('salvation plan eternal life');
const restoration = await client.searchBasicBeliefs('restoration Joseph Smith prophets');

// Basic practices  
const baptism = await client.searchBasicBeliefs('baptism ordinances requirements');
const prayer = await client.searchBasicBeliefs('prayer how to pray personal');
```

### Investigator Resources
```javascript
// Introduction to the Church
const whatWeBelieve = await client.searchBasicBeliefs('what we believe basic doctrines');
const churchStructure = await client.searchBasicBeliefs('church organization structure leadership');

// Getting involved
const attending = await client.searchBasicBeliefs('attending church first time visiting');
const meetingMissionaries = await client.searchBasicBeliefs('missionaries meeting learning more');
```

## Content Coverage

### Basic Beliefs Topics:
- **Core Doctrines** - Fundamental teachings about God, Christ, and salvation
- **Church Organization** - Structure, leadership, and organization
- **Ordinances** - Baptism, confirmation, and other sacred ordinances  
- **Scripture** - Introduction to Church scripture and study
- **Worship** - How we worship and practice our faith
- **Community** - Church community and fellowship
- **Investigator Resources** - Information for those learning about the Church

## Notes

- **Introductory Focus**: Designed for newcomers and those unfamiliar with the Church
- **Accessible Language**: Uses simple, clear explanations of complex doctrines
- **Investigator Friendly**: Perfect for those considering learning more about the Church
- **Fundamental Coverage**: Covers essential beliefs and practices
- **Welcome Tone**: Inviting and inclusive approach to sharing beliefs

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [Gospel Topics Search](gospel-topics-search.md) - More detailed doctrinal explanations
- [General Conference Search](general-conference-search.md) - Leadership teachings on beliefs