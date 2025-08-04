# BYU Speeches Search: `/search/proxy/vertex-search` (BYU Filter)

Search within BYU devotional and forum addresses for academic, spiritual, and educational content from Brigham Young University.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)  
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search BYU devotional and forum speeches for academic, spiritual, and educational content

## Parameters

### Required Parameters
```typescript
interface BYUSpeechesSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // BYU speeches domain filter
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Structure
```javascript
filter: 'siteSearch:"speeches.byu.edu" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*"'
```

## Code Integration

### JavaScript Implementation
```javascript
async searchBYUSpeeches(query, options = {}) {
  const filter = 'siteSearch:"speeches.byu.edu" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
  
  const params = new URLSearchParams({
    q: query,
    start: options.start || 1,
    searchType: 'web',
    filter: filter,
    orderBy: options.orderBy || ''
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-search?${params}`;
  
  return this._executeSearch(url, 'byu-speeches');
}

inferSpeechType(title, url) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('devotional')) return 'Devotional';
  if (lowerTitle.includes('forum')) return 'Forum';
  if (lowerTitle.includes('conference')) return 'Conference';
  if (lowerTitle.includes('commencement')) return 'Commencement';
  if (lowerTitle.includes('inaugural')) return 'Inaugural';
  
  return 'University Address';
}

extractSpeaker(title) {
  // Basic speaker extraction from title patterns
  const patterns = [
    /^(.+?)\s*[-–—]\s*.+/,  // "Speaker Name - Title"
    /^(.+?)\s*[:]\s*.+/,    // "Speaker Name: Title"
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1].length < 50) { // Reasonable speaker name length
      return match[1].trim();
    }
  }
  
  return null;
}
```

## Usage Examples

### Academic and Educational Topics
```javascript
// Educational philosophy and methods
const education = await client.searchBYUSpeeches('education learning teaching methods');
const scholarship = await client.searchBYUSpeeches('scholarship research academic excellence');

// Professional development
const leadership = await client.searchBYUSpeeches('leadership service professional development');
const ethics = await client.searchBYUSpeeches('ethics integrity professional conduct');
```

### Spiritual and Religious Topics
```javascript
// Faith and spirituality in education
const faithLearning = await client.searchBYUSpeeches('faith learning gospel education');
const spirituality = await client.searchBYUSpeeches('spirituality prayer personal revelation');

// Gospel application
const discipleship = await client.searchBYUSpeeches('discipleship following Christ daily');
const service = await client.searchBYUSpeeches('service others community involvement');
```

### Student Life and Development
```javascript
// University experience
const studentLife = await client.searchBYUSpeeches('student life college experience');
const timeManagement = await client.searchBYUSpeeches('time management priorities balance');

// Personal development
const characterBuilding = await client.searchBYUSpeeches('character development virtues');
const goalsAchievement = await client.searchBYUSpeeches('goals achievement success planning');
```

### Contemporary Issues
```javascript
// Modern challenges
const technology = await client.searchBYUSpeeches('technology digital age media');
const globalIssues = await client.searchBYUSpeeches('global citizenship world issues');

// Cultural topics
const diversity = await client.searchBYUSpeeches('diversity inclusion understanding others');
const familyWork = await client.searchBYUSpeeches('family work balance priorities');
```

## Content Coverage

### Speech Categories:
- **Devotionals** - Spiritual addresses focusing on faith and gospel principles
- **Forums** - Academic and cultural presentations on various topics
- **Commencement** - Graduation addresses with life guidance and inspiration
- **Special Events** - Addresses for university celebrations and commemorations
- **Guest Lectures** - Presentations by visiting scholars and dignitaries

### Content Types:
- **Spiritual Guidance** - Faith-based counsel and inspiration
- **Academic Excellence** - Scholarly perspectives and educational philosophy
- **Personal Development** - Character building and life skills
- **Professional Preparation** - Career guidance and professional ethics
- **Cultural Enrichment** - Arts, literature, and cultural understanding
- **Global Perspectives** - International awareness and citizenship
- **Historical Context** - University history and educational heritage

### Speaker Categories:
- **University Leadership** - Presidents, vice presidents, and deans
- **Faculty Members** - Professors and academic leaders
- **Church Leaders** - General Authorities and local leadership
- **Alumni** - Distinguished graduates and professionals
- **Guest Speakers** - External experts and thought leaders
- **Student Leaders** - Student body officers and representatives

### Target Audience:
- **University Students** - Current BYU students across all disciplines
- **Faculty and Staff** - University employees and academic professionals
- **Alumni** - Graduates maintaining connection with the university
- **Prospective Students** - Those considering BYU education
- **Church Members** - Broader Church membership interested in educational perspectives
- **Academic Community** - Scholars and educators beyond BYU

## Testing Information

### cURL Testing Commands
```bash
# BYU speeches search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=web&filter=siteSearch%3A%22speeches.byu.edu%22%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)&orderBy="

# Educational topic search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=education%20learning&start=1&searchType=web&filter=siteSearch%3A%22speeches.byu.edu%22&orderBy="
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Academic language barriers | Complex terminology and concepts | Search for basic terms or introductory content |
| Date/time references | Outdated cultural references | Consider historical context when applying advice |
| Specific audience focus | Content targeted to university students | Adapt principles to personal circumstances |
| Large volume of content | Many results for broad topics | Use specific speaker names or time periods |

## Educational Philosophy

### BYU Mission Integration:
- **Spiritual Strengthening** - Building faith alongside academic achievement
- **Character Development** - Emphasizing integrity and moral development
- **Intellectual Enlargement** - Pursuing truth through scholarship and revelation
- **Service Orientation** - Preparing graduates for lifelong service
- **Global Citizenship** - Understanding diverse perspectives and cultures

### Unique Characteristics:
- **Faith-Learning Integration** - Combining spiritual and academic growth
- **Honor Code Emphasis** - Living principles of integrity and virtue
- **Service Learning** - Connecting education with community service
- **Cultural Enrichment** - Appreciation for arts, literature, and diverse cultures
- **Professional Excellence** - Preparing for leadership in various fields

## Notes

- **Educational Focus**: Designed for university students and academic community
- **Faith Integration**: Combines spiritual principles with academic and professional guidance
- **Leadership Development**: Strong emphasis on preparing future leaders
- **Character Building**: Focus on integrity, service, and moral development
- **Academic Excellence**: High standards for scholarship and intellectual growth
- **Global Perspective**: Preparation for worldwide service and citizenship
- **Historical Archive**: Decades of addresses from university and Church leaders
- **Practical Application**: Guidance applicable beyond university experience
- **Cultural Enrichment**: Emphasis on arts, literature, and cultural understanding
- **Professional Preparation**: Career guidance and professional development

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [General Conference Search](general-conference-search.md) - Church leadership addresses
- [YA Weekly Search](ya-weekly-search.md) - Young adult focused content
- [Church History Search](church-history-search.md) - Historical context and development