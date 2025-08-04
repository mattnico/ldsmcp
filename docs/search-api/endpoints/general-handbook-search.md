# General Handbook Search: `/search/proxy/vertex-search` (Handbook Filter)

Specialized search within the General Handbook (Church policies, procedures, and administrative guidance) using Google Vertex AI Search.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search within General Handbook for Church policies, procedures, and administrative guidance

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
// Search for specific policy terms
q: '"bishop responsibilities"'     // Finds exact administrative roles
q: '"disciplinary council"'        // Finds specific procedures
q: '"temple recommend"'            // Finds exact policy terms
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
// Broad policy exploration
q: 'youth activities guidelines'   // Finds related policies and procedures
q: 'financial procedures'          // Finds various financial guidelines
q: 'leadership training'           // Finds leadership development content
```

## Parameters

### Required Parameters
```typescript
interface GeneralHandbookSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Handbook-specific filter expression
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Structure
The filter parameter includes:
- **Handbook Restriction**: `siteSearch:"churchofjesuschrist.org/study/manual/general-handbook"`
- **Language Filtering**: `(siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")`
- **Standard Exclusions**: Removes ads, tracking, and other non-content URLs

### Example Request
```javascript
const params = new URLSearchParams({
  q: 'RESTORATION',
  start: '1',
  searchType: 'web',
  filter: 'siteSearch:"churchofjesuschrist.org/study/manual/general-handbook" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"',
  orderBy: ''
});
```

## Response Format

The response follows the standard Google Vertex AI Search format (same as [vertex-search.md](vertex-search.md)).

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async searchGeneralHandbook(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    start: options.start || 1,
    searchType: 'web',
    filter: 'siteSearch:"churchofjesuschrist.org/study/manual/general-handbook" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"',
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
          contentType: 'general-handbook',
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
      searchType: 'general-handbook'
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
// Add General Handbook search tool
{
  name: "search_general_handbook",
  description: "Search within the General Handbook for Church policies and procedures",
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
async function handleSearchGeneralHandbook(args, messageId) {
  const { query, limit = 20, offset = 0 } = args;
  
  try {
    const searchResponse = await gospelLibraryClient.searchGeneralHandbook(query, {
      start: offset + 1
    });
    
    if (searchResponse.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Error searching General Handbook: ${searchResponse.error.message}`
          }]
        }
      });
      return;
    }

    let resultText = `# General Handbook Search Results for "${query}"\n\n`;
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

### Administrative Responsibilities
```javascript
// Find specific leadership responsibilities
const bishopDuties = await client.searchGeneralHandbook('"bishop responsibilities"');
const stakePres = await client.searchGeneralHandbook('"stake president duties"');

// Search for organizational guidance
const wardCouncil = await client.searchGeneralHandbook('ward council meetings agenda');
const leadershipTraining = await client.searchGeneralHandbook('leadership training development');
```

### Policy and Procedure Lookups
```javascript
// Find specific policies
const disciplinary = await client.searchGeneralHandbook('"disciplinary council procedures"');
const templeRecommend = await client.searchGeneralHandbook('"temple recommend interview"');

// Search for organizational procedures
const financing = await client.searchGeneralHandbook('financial procedures budgets');
const records = await client.searchGeneralHandbook('membership records procedures');
```

### Program Administration
```javascript
// Youth program guidance
const youthPrograms = await client.searchGeneralHandbook('youth activities guidelines safety');
const mutual = await client.searchGeneralHandbook('mutual activities planning');

// Auxiliary organization support
const reliefSociety = await client.searchGeneralHandbook('Relief Society presidency responsibilities');
const primary = await client.searchGeneralHandbook('Primary organization teaching');
```

### Pastoral Care
```javascript
// Member care and support
const counseling = await client.searchGeneralHandbook('member counseling support');
const crisis = await client.searchGeneralHandbook('crisis intervention emergency');

// Special circumstances
const military = await client.searchGeneralHandbook('military members deployment');
const disabilities = await client.searchGeneralHandbook('disabilities accommodations inclusion');
```

### Temple and Ordinance Work
```javascript
// Temple service guidance
const templeService = await client.searchGeneralHandbook('temple service ordinances');
const familyHistory = await client.searchGeneralHandbook('family history temple work');

// Ordinance procedures
const baptisms = await client.searchGeneralHandbook('baptism confirmation procedures');
const priesthood = await client.searchGeneralHandbook('priesthood ordination procedures');
```

## Testing Information

### cURL Testing Commands
```bash
# Basic General Handbook search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fmanual%2Fgeneral-handbook%22%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)%20AND%20-siteSearch%3A%22*imageView%3D*%22&orderBy="

# Search for specific policies
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=bishop%20responsibilities&start=1&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fmanual%2Fgeneral-handbook%22&orderBy="
```

## Content Coverage

### General Handbook Sections Include:
- **Leadership Principles** and fundamental Church governance
- **Stake Leadership** responsibilities and procedures
- **Bishopric and Ward Leadership** duties and guidelines
- **Priesthood and Auxiliary Organizations** administration
- **Church Meetings and Activities** planning and conduct
- **Ordinances and Blessings** procedures and requirements
- **Records and Reports** management and requirements
- **Temporal Concerns** including finances, properties, and legal matters
- **Care and Support** for members in various circumstances
- **Policies and Guidelines** for special situations and populations

### Result Types Include:
- **Policy statements** with official Church positions
- **Procedural guidelines** with step-by-step instructions
- **Administrative responsibilities** for various leadership positions
- **Forms and documentation** requirements
- **Legal and compliance** guidance
- **Member care protocols** for pastoral support
- **Organizational structures** and reporting relationships
- **Training materials** and leadership development resources

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Overly technical results | Results too detailed for general questions | Use broader, less administrative terms |
| No results for informal terms | Empty results for casual language | Use official Church terminology |
| Policy updates not reflected | Outdated information | Cross-reference with official Church communications |
| Limited context | Results without sufficient background | Search for related procedures or broader topics |

## Content Organization

### Handbook Structure
The General Handbook is organized into major sections:

1. **Doctrinal Foundation** (Chapters 1-3)
2. **Supporting Individuals and Families** (Chapters 4-6) 
3. **Priesthood Principles** (Chapters 7-9)
4. **Leadership in The Church of Jesus Christ** (Chapters 10-12)
5. **Stake Leadership** (Chapters 13-16)
6. **Bishopric and Ward Leadership** (Chapters 17-20)
7. **Melchizedek Priesthood** (Chapters 21-23)
8. **Relief Society** (Chapters 24-26)
9. **Sunday School** (Chapters 27-29)
10. **Primary** (Chapters 30-32)
11. **Young Women** (Chapters 33-35)
12. **Young Men** (Chapters 36-38)

### Search Tips by Section
- **Leadership questions**: Use role-specific terms (bishop, stake president, counselor)
- **Policy questions**: Use exact terminology from official sources
- **Procedural questions**: Include action words (conduct, organize, administer)
- **Member care**: Use compassionate, person-centered language

## Notes

- **Authoritative Source**: Official Church policies and procedures
- **Leadership Focused**: Primarily for Church leaders and administrators
- **Comprehensive Coverage**: Covers all aspects of Church administration
- **Regular Updates**: Content reflects current Church policies and procedures
- **Practical Guidance**: Emphasizes implementation and real-world application
- **Global Perspective**: Addresses diverse cultural and legal contexts
- **Member-Centered**: Focuses on supporting and strengthening individuals and families
- **Doctrinal Foundation**: Grounded in gospel principles and revelation

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [Come Follow Me Search](come-follow-me-search.md) - Study materials complement
- [General Conference Search](general-conference-search.md) - Leadership counsel and guidance
- [Books & Lessons Search](books-lessons-search.md) - Training and development materials