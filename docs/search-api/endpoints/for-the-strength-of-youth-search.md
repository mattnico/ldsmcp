# For the Strength of Youth Search: `/search/proxy/vertex-search` (FTSOY Filter)

Search within For the Strength of Youth resources with optional year filtering for both historical and current content.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search within For the Strength of Youth guidebook, activities, and youth-focused resources

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
q: '"dating standards"'            // Finds specific guideline topics
q: '"spiritual strength"'          // Finds exact doctrinal phrases
q: '"media and entertainment"'     // Finds specific section titles
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
q: 'dating relationships standards' // Finds related topics and guidelines
q: 'social media technology'       // Finds modern application guidance  
q: 'physical spiritual emotional'   // Finds holistic development content
```

## Parameters

### Required Parameters
```typescript
interface ForTheStrengthOfYouthSearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // FTSOY directory filter with optional year filtering
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Options

**All FTSOY Content (Default)**
```javascript
filter: 'siteSearch:"churchofjesuschrist.org/study/ftsoy/*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")'
```

**Specific Year (e.g., 2024 Edition)**
```javascript
filter: 'siteSearch:"churchofjesuschrist.org/study/ftsoy/2024" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")'
```

## Code Integration

### JavaScript Implementation
```javascript
async searchForTheStrengthOfYouth(query, options = {}) {
  let filter;
  
  if (options.year) {
    // Filter by specific year/edition
    filter = `siteSearch:"churchofjesuschrist.org/study/ftsoy/${options.year}" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*"`;
  } else {
    // All FTSOY content
    filter = 'siteSearch:"churchofjesuschrist.org/study/ftsoy/*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*"';
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
          contentType: 'for-the-strength-of-youth',
          metadata: {
            edition: this.extractEdition(fields.link.stringValue),
            section: this.extractSection(fields.link.stringValue),
            displayLink: fields.displayLink?.stringValue
          }
        };
      }),
      pagination: { total: data.totalSize, nextPageToken: data.nextPageToken, start: options.start || 1 },
      searchType: 'for-the-strength-of-youth',
      edition: options.year || 'all-editions'
    };
  } catch (error) {
    return { error: { message: error.message, code: 'FETCH_ERROR' } };
  }
}

extractEdition(url) {
  const editionMatch = url.match(/\/ftsoy\/(\d{4})/);
  return editionMatch ? editionMatch[1] : 'multiple';
}

extractSection(url) {
  const sectionMatch = url.match(/\/ftsoy\/(?:\d{4}\/)?([^\/]+)/);
  if (sectionMatch && sectionMatch[1] !== '2024') {
    return sectionMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return null;
}

// Convenience methods
async searchFTSOYCurrent(query) {
  const currentYear = new Date().getFullYear();
  return this.searchForTheStrengthOfYouth(query, { year: currentYear });
}

async searchFTSOY2024(query) {
  return this.searchForTheStrengthOfYouth(query, { year: 2024 });
}
```

## Usage Examples

### Core Standards and Guidelines
```javascript
// Search specific standards
const datingStandards = await client.searchForTheStrengthOfYouth('"dating standards"');
const mediaGuidelines = await client.searchForTheStrengthOfYouth('"media and entertainment"');
const dressingGuidelines = await client.searchForTheStrengthOfYouth('"dress and appearance"');

// Search by principle
const integrityGuidance = await client.searchForTheStrengthOfYouth('honesty integrity truth');
const spiritualStrength = await client.searchForTheStrengthOfYouth('prayer scripture study spiritual');
```

### Modern Applications
```javascript
// Technology and social media
const socialMedia = await client.searchForTheStrengthOfYouth('social media technology internet');
const digitalCitizenship = await client.searchForTheStrengthOfYouth('online behavior digital responsibility');

// Contemporary challenges
const mentalHealth = await client.searchForTheStrengthOfYouth('mental health emotional wellness');
const peerPressure = await client.searchForTheStrengthOfYouth('peer pressure friends influence');
```

### Personal Development
```javascript
// Character development
const characterBuilding = await client.searchForTheStrengthOfYouth('character virtues personal development');
const leadershipSkills = await client.searchForTheStrengthOfYouth('leadership service others');

// Goal setting and achievement
const goalSetting = await client.searchForTheStrengthOfYouth('goals planning future preparation');
const education = await client.searchForTheStrengthOfYouth('education learning knowledge skills');
```

### Relationship Guidance
```javascript
// Family relationships
const familyRelations = await client.searchForTheStrengthOfYouth('family relationships parents siblings');
const respectParents = await client.searchForTheStrengthOfYouth('honor parents family unity');

// Friendship and social relationships
const healthyFriendships = await client.searchForTheStrengthOfYouth('friendship friends peer relationships');
const socialInteraction = await client.searchForTheStrengthOfYouth('social activities group dynamics');
```

### 2024 Edition Specific
```javascript
// Search the most current edition
const current2024 = await client.searchFTSOY2024('identity worth divine nature');
const updated2024 = await client.searchFTSOY2024('covenant path discipleship');
```

## Content Coverage

### FTSOY Topic Areas:
- **Identity and Worth** - Understanding divine identity and purpose
- **Agency and Accountability** - Making righteous choices
- **Repentance** - Process of change and forgiveness
- **Sabbath Day** - Worship and rest observance
- **Friends** - Choosing and being good friends
- **Dating** - Standards for romantic relationships
- **Sexual Purity** - Moral standards and boundaries
- **Dress and Appearance** - Modesty and appropriate presentation
- **Media and Entertainment** - Wise media consumption
- **Music and Dancing** - Appropriate entertainment choices
- **Language** - Clean and uplifting communication
- **Honesty** - Integrity in all dealings
- **Gratitude** - Appreciation and thankfulness
- **Physical Health** - Care of body and mind
- **Learning** - Education and personal development
- **Work** - Value of honest labor and service

### Content Types:
- **Guidelines and Standards** - Clear expectations and principles
- **Scriptural Foundation** - Supporting doctrine and references
- **Modern Applications** - Contemporary examples and challenges
- **Personal Questions** - Self-reflection and assessment tools
- **Activities and Ideas** - Practical implementation suggestions
- **Stories and Examples** - Illustrative experiences and testimonies

## Testing Information

### cURL Testing Commands
```bash
# All FTSOY content search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fftsoy%2F*%22%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)&orderBy="

# 2024 edition specific
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=dating%20standards&start=1&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fftsoy%2F2024%22%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)&orderBy="
```

## Historical Context

### Edition Evolution:
- **Original FTSOY**: Traditional pamphlet format with specific rules
- **2024 Edition**: Completely reimagined with gospel-centered approach
- **Principle-Based**: Shift from rules to principles and personal revelation
- **Modern Relevance**: Updated to address contemporary challenges and opportunities

### Key Changes in 2024:
- **Gospel-Centered Approach**: Emphasizes relationship with Jesus Christ
- **Personal Revelation**: Encourages individual inspiration and guidance  
- **Principle Over Rules**: Focuses on eternal principles rather than specific restrictions
- **Positive Framework**: Emphasizes growth and development rather than just avoiding problems
- **Cultural Sensitivity**: Acknowledges diverse cultural contexts and applications

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Mixed edition results | Results from different FTSOY versions | Use year filter for specific edition |
| Overly broad topic searches | Too many unrelated results | Use specific section titles or exact phrases |
| Modern terminology gaps | Limited results for current issues | Try broader terms or synonyms |
| Cultural application questions | Generic advice for specific situations | Look for principle-based guidance rather than specific rules |

## Notes

- **Youth Focus**: Specifically designed for teenagers and young adults
- **Principle-Based**: 2024 edition emphasizes gospel principles over specific rules
- **Cultural Adaptability**: Designed to apply across different cultural contexts
- **Personal Revelation**: Encourages individual guidance through prayer and scripture study
- **Positive Development**: Emphasizes growing toward ideals rather than just avoiding problems
- **Family Integration**: Designed to work with family guidance and support
- **Modern Relevance**: Addresses contemporary challenges like social media and technology
- **Gospel Foundation**: Grounded in core gospel principles and Jesus Christ's teachings
- **Practical Application**: Includes specific suggestions and activities for implementation
- **Global Perspective**: Written for youth worldwide with diverse backgrounds and circumstances

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [Liahona Search](liahona-search.md) - Youth articles and content in magazine
- [Come Follow Me Search](come-follow-me-search.md) - Complementary study materials
- [General Conference Search](general-conference-search.md) - Youth-focused conference messages