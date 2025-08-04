# Children's Content Search: `/search/proxy/vertex-search` (Multi-Source Filter)

Comprehensive search across all Church content designed for children, including Friend magazine, children's media collections, and study materials.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search across all child-focused Church content including Friend magazine, media, and educational materials

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
q: '"Primary lesson"'              // Finds specific lesson types
q: '"baptism for children"'        // Finds exact topics for kids
q: '"family home evening"'         // Finds family activity content
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
q: 'Jesus loves children'          // Finds various child-focused content about Jesus
q: 'prayer family activities'      // Finds prayer-related family content
q: 'scripture stories kids'        // Finds scripture stories adapted for children
```

## Parameters

### Required Parameters
```typescript
interface ChildrenContentSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Multi-source children's content filter
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Multi-Source Filter Structure
The filter combines three primary children's content sources:
- **Friend Magazine**: `siteSearch:"churchofjesuschrist.org/study/friend/*"`
- **Children's Media**: `siteSearch:"churchofjesuschrist.org/media/collection/children"`
- **Children's Study Materials**: `siteSearch:"churchofjesuschrist.org/study/children"`

### Year Filtering Options

**All Years (Default)**
```javascript
filter: '(siteSearch:"churchofjesuschrist.org/study/friend/*" OR siteSearch:"churchofjesuschrist.org/media/collection/children" OR siteSearch:"churchofjesuschrist.org/study/children") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")'
```

**Specific Year (e.g., 2024)**
```javascript
filter: '(siteSearch:"churchofjesuschrist.org/study/friend/2024" OR siteSearch:"churchofjesuschrist.org/media/collection/children" OR siteSearch:"churchofjesuschrist.org/study/children") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")'
```

## Code Integration

### JavaScript Implementation
```javascript
async searchChildrenContent(query, options = {}) {
  let friendFilter;
  
  if (options.year) {
    // Filter Friend magazine by specific year, keep other sources all years
    friendFilter = `siteSearch:"churchofjesuschrist.org/study/friend/${options.year}"`;
  } else {
    // All Friend magazine content
    friendFilter = 'siteSearch:"churchofjesuschrist.org/study/friend/*"';
  }
  
  const filter = `(${friendFilter} OR siteSearch:"churchofjesuschrist.org/media/collection/children" OR siteSearch:"churchofjesuschrist.org/study/children") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"`;
  
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
          contentType: 'children-content',
          metadata: {
            source: this.extractChildrenSource(fields.link.stringValue),
            year: this.extractYear(fields.link.stringValue),
            ageGroup: this.inferAgeGroup(fields.title.stringValue, fields.link.stringValue),
            displayLink: fields.displayLink?.stringValue
          }
        };
      }),
      pagination: { total: data.totalSize, nextPageToken: data.nextPageToken, start: options.start || 1 },
      searchType: 'children-content',
      sources: this.getSourceBreakdown(data.results),
      filterYear: options.year || 'all-years'
    };
  } catch (error) {
    return { error: { message: error.message, code: 'FETCH_ERROR' } };
  }
}

extractChildrenSource(url) {
  if (url.includes('/study/friend/')) return 'Friend Magazine';
  if (url.includes('/media/collection/children')) return 'Children\'s Media';
  if (url.includes('/study/children')) return 'Children\'s Study Materials';
  return 'Children\'s Content';
}

extractYear(url) {
  const yearMatch = url.match(/\/friend\/(\d{4})/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

inferAgeGroup(title, url) {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  if (lowerTitle.includes('primary') || lowerUrl.includes('primary')) return 'Primary (3-11)';
  if (lowerTitle.includes('nursery') || lowerUrl.includes('nursery')) return 'Nursery (18 months-3)';
  if (lowerTitle.includes('toddler') || lowerTitle.includes('baby')) return 'Nursery (18 months-3)';
  if (lowerTitle.includes('teen') || lowerTitle.includes('youth')) return 'Youth (12-17)';
  return 'Children (General)';
}

getSourceBreakdown(results) {
  const breakdown = { friend: 0, media: 0, study: 0 };
  results.forEach(result => {
    const link = result.document.derivedStructData.fields.link.stringValue;
    if (link.includes('/study/friend/')) breakdown.friend++;
    else if (link.includes('/media/collection/children')) breakdown.media++;
    else if (link.includes('/study/children')) breakdown.study++;
  });
  return breakdown;
}

// Convenience methods
async searchFriendMagazine(query, year = null) {
  return this.searchChildrenContent(query, { year });
}

async searchChildrenMedia(query) {
  // Filter to only media content (would need separate implementation)
  return this.searchChildrenContent(query);
}

async searchChildrenByAgeGroup(query, ageGroup) {
  // Enhanced search with age-appropriate filtering
  const ageTerms = {
    'nursery': 'baby toddler nursery simple',
    'primary': 'primary children kids',
    'youth': 'youth teenager young adult'
  };
  
  const enhancedQuery = ageTerms[ageGroup] 
    ? `${query} ${ageTerms[ageGroup]}` 
    : query;
    
  return this.searchChildrenContent(enhancedQuery);
}
```

### MCP Tool Integration
```javascript
// Add Children's Content search tool
{
  name: "search_children_content",
  description: "Search across all Church content designed for children including Friend magazine, media, and study materials",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query text (use quotes for exact phrases)"
      },
      year: {
        type: "number",
        description: "Filter Friend magazine by specific year (optional)"
      },
      ageGroup: {
        type: "string",
        description: "Target age group for content",
        enum: ["nursery", "primary", "youth", "all"]
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
async function handleSearchChildrenContent(args, messageId) {
  const { query, year, ageGroup, limit = 20, offset = 0 } = args;
  
  try {
    let searchResponse;
    
    if (ageGroup && ageGroup !== 'all') {
      searchResponse = await gospelLibraryClient.searchChildrenByAgeGroup(query, ageGroup);
    } else {
      searchResponse = await gospelLibraryClient.searchChildrenContent(query, {
        start: offset + 1,
        year
      });
    }
    
    if (searchResponse.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Error searching children's content: ${searchResponse.error.message}`
          }]
        }
      });
      return;
    }

    let resultText = `# Children's Content Search Results for "${query}"\n\n`;
    resultText += `Found ${searchResponse.pagination.total} total results`;
    if (searchResponse.filterYear && searchResponse.filterYear !== 'all-years') {
      resultText += ` (${searchResponse.filterYear} Friend magazine)`;
    }
    resultText += `:\n\n`;

    // Add source breakdown
    if (searchResponse.sources) {
      resultText += `**Content Sources:**\n`;
      resultText += `- Friend Magazine: ${searchResponse.sources.friend} results\n`;
      resultText += `- Children's Media: ${searchResponse.sources.media} results\n`;
      resultText += `- Study Materials: ${searchResponse.sources.study} results\n\n`;
    }

    searchResponse.results.slice(0, limit).forEach((result, index) => {
      resultText += `## ${index + 1}. ${result.title}\n`;
      resultText += `**Source:** ${result.metadata.source}\n`;
      if (result.metadata.year) {
        resultText += `**Year:** ${result.metadata.year}\n`;
      }
      resultText += `**Age Group:** ${result.metadata.ageGroup}\n`;
      resultText += `**URI:** ${result.uri}\n`;
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

### Friend Magazine Content
```javascript
// Search recent Friend magazine
const recentFriend = await client.searchFriendMagazine('Jesus Christ stories', 2024);
const prayerStories = await client.searchFriendMagazine('"prayer" family', 2024);

// Search historical Friend content
const classicStories = await client.searchFriendMagazine('scripture stories', 2020);
```

### Age-Appropriate Content
```javascript
// Nursery age content (18 months - 3 years)
const nurseryContent = await client.searchChildrenByAgeGroup('Jesus loves me', 'nursery');
const toddlerActivities = await client.searchChildrenByAgeGroup('simple songs prayer', 'nursery');

// Primary age content (3-11 years)
const primaryLessons = await client.searchChildrenByAgeGroup('baptism preparation', 'primary');
const scriptureStories = await client.searchChildrenByAgeGroup('Book of Mormon heroes', 'primary');

// Youth content (12-17 years)
const youthGuidance = await client.searchChildrenByAgeGroup('faith building testimony', 'youth');
```

### Family Activity Ideas
```javascript
// Family home evening ideas
const fheActivities = await client.searchChildrenContent('"family home evening" activities games');
const familyLessons = await client.searchChildrenContent('family study ideas children');

// Holiday and seasonal content
const christmasActivities = await client.searchChildrenContent('Christmas activities children family');
const easterLessons = await client.searchChildrenContent('Easter resurrection children');
```

### Teaching and Learning Resources
```javascript
// Primary teaching helps
const teachingIdeas = await client.searchChildrenContent('"Primary lesson" activities visual aids');
const singingTime = await client.searchChildrenContent('singing time Primary music activities');

// Home teaching resources
const parentGuidance = await client.searchChildrenContent('teaching children home gospel');
const faithBuilding = await client.searchChildrenContent('children testimony faith building');
```

## Content Coverage

### Friend Magazine Content:
- **Scripture Stories** - Adapted for children with illustrations
- **Modern Stories** - Contemporary examples of gospel living
- **Activity Pages** - Crafts, games, and puzzles
- **Music and Songs** - Child-friendly hymns and Primary songs
- **Family Features** - Family home evening ideas and activities
- **Testimony Builders** - Faith-promoting stories and examples
- **Holiday Content** - Seasonal activities and lessons
- **Primary Lessons** - Age-appropriate gospel instruction

### Children's Media Collection:
- **Videos** - Animated scripture stories and gospel concepts
- **Audio** - Children's music, stories, and Primary songs
- **Interactive Content** - Games and educational activities
- **Visual Aids** - Pictures and illustrations for teaching

### Children's Study Materials:
- **Primary Manuals** - Age-graded lesson materials
- **Family Study Helps** - Resources for parents and families
- **Activity Guides** - Practical implementation ideas
- **Teaching Resources** - Helps for Primary teachers and leaders

### Age Group Targeting:

**Nursery (18 months - 3 years):**
- Simple songs and fingerplays
- Basic gospel concepts (Jesus loves me, prayer, family)
- Sensory activities and movement
- Picture-based learning

**Primary (3-11 years):**
- Scripture stories with moral lessons
- Baptism and confirmation preparation
- Faith-building activities and games
- Primary program preparation

**Youth Transition (12+ years):**
- Character development stories
- Testimony building experiences
- Service project ideas
- Leadership development

## Testing Information

### cURL Testing Commands
```bash
# All children's content search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=web&filter=(siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Ffriend%2F*%22%20OR%20siteSearch%3A%22churchofjesuschrist.org%2Fmedia%2Fcollection%2Fchildren%22%20OR%20siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fchildren%22)%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)&orderBy="

# 2024 Friend magazine specific
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=Jesus%20Christ&start=1&searchType=web&filter=(siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Ffriend%2F2024%22%20OR%20siteSearch%3A%22churchofjesuschrist.org%2Fmedia%2Fcollection%2Fchildren%22)&orderBy="
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Content too advanced for age | Results not age-appropriate | Use age-specific terms in query or age group filtering |
| Mixed content sources | Difficult to identify content type | Check metadata source field for content origin |
| Limited recent Friend content | Few results for current year | Friend magazine may have publishing delays, try previous year |
| Media content not appearing | Only text-based results | Media collection may require specific media-focused queries |

## Content Organization

### Friend Magazine Structure:
- **Monthly Issues** - Organized by year and month
- **Recurring Features** - Funstuff, scripture stories, music
- **Special Issues** - Holiday themes, conference follow-up
- **Age Divisions** - Some content targeted to specific age ranges

### Educational Progression:
- **Foundational Concepts** - Jesus, prayer, family, love
- **Gospel Principles** - Faith, repentance, baptism, Holy Ghost
- **Scripture Literacy** - Familiar stories and characters
- **Application Skills** - Service, kindness, obedience
- **Testimony Building** - Personal spiritual experiences

## Notes

- **Multi-Source Integration**: Combines three distinct content repositories
- **Age-Appropriate**: Content specifically designed and tested for children
- **Family-Centered**: Emphasizes family involvement and home teaching
- **Visual Learning**: Rich use of illustrations, videos, and interactive content
- **Cultural Sensitivity**: Content designed for global Church membership
- **Developmental Awareness**: Considers cognitive and spiritual development stages
- **Activity-Rich**: Emphasizes hands-on learning and engagement
- **Music Integration**: Strong emphasis on Primary songs and children's music
- **Testimony Building**: Focuses on faith development appropriate for children
- **Parent Resources**: Includes guidance for parents and family implementation

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [YA Weekly Search](ya-weekly-search.md) - Young adult content (older youth)
- [Liahona Search](liahona-search.md) - Magazine content including youth sections
- [For the Strength of Youth Search](for-the-strength-of-youth-search.md) - Teen guidance