# Church History Search: `/search/proxy/vertex-search` (Multi-Domain Filter)

Comprehensive search across multiple Church history websites and archives for historical documents, research, and scholarly resources.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search across official Church history websites, archives, and scholarly collections

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
q: '"First Vision"'                // Finds specific historical events
q: '"Doctrine and Covenants 76"'   // Finds specific scriptural revelations
q: '"Brigham Young"'               // Finds specific historical figures
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
q: 'restoration Joseph Smith'       // Finds restoration-related historical content
q: 'Nauvoo temple construction'    // Finds related historical topics
q: 'pioneer migration west'        // Finds thematic historical content
```

## Parameters

### Required Parameters
```typescript
interface ChurchHistorySearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // Multi-domain historical filter
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Multi-Domain Filter Structure
The filter combines three primary historical research domains:
- **Church History Department**: `siteSearch:"history.churchofjesuschrist.org"`
- **Church Historian's Press**: `siteSearch:"churchhistorianspress.org"`
- **Joseph Smith Papers**: `siteSearch:"josephsmithpapers.org"`

### Filter Expression
```javascript
filter: '(siteSearch:"history.churchofjesuschrist.org" OR siteSearch:"churchhistorianspress.org" OR siteSearch:"josephsmithpapers.org") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"'
```

## Code Integration

### JavaScript Implementation
```javascript
async searchChurchHistory(query, options = {}) {
  const filter = '(siteSearch:"history.churchofjesuschrist.org" OR siteSearch:"churchhistorianspress.org" OR siteSearch:"josephsmithpapers.org") AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
  
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
          contentType: 'church-history',
          metadata: {
            source: this.extractHistoricalSource(fields.link.stringValue),
            documentType: this.inferDocumentType(fields.title.stringValue, fields.link.stringValue),
            period: this.inferHistoricalPeriod(fields.title.stringValue),
            displayLink: fields.displayLink?.stringValue
          }
        };
      }),
      pagination: { total: data.totalSize, nextPageToken: data.nextPageToken, start: options.start || 1 },
      searchType: 'church-history',
      sources: this.getHistoricalSourceBreakdown(data.results)
    };
  } catch (error) {
    return { error: { message: error.message, code: 'FETCH_ERROR' } };
  }
}

extractHistoricalSource(url) {
  if (url.includes('history.churchofjesuschrist.org')) return 'Church History Department';
  if (url.includes('churchhistorianspress.org')) return 'Church Historian\'s Press';
  if (url.includes('josephsmithpapers.org')) return 'Joseph Smith Papers';
  return 'Church History';
}

inferDocumentType(title, url) {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  if (lowerTitle.includes('revelation') || lowerUrl.includes('revelation')) return 'Revelation';
  if (lowerTitle.includes('letter') || lowerUrl.includes('letter')) return 'Letter';
  if (lowerTitle.includes('journal') || lowerTitle.includes('diary')) return 'Journal/Diary';
  if (lowerTitle.includes('discourse') || lowerTitle.includes('sermon')) return 'Discourse/Sermon';
  if (lowerTitle.includes('minutes') || lowerTitle.includes('meeting')) return 'Meeting Minutes';
  if (lowerTitle.includes('document') || lowerUrl.includes('document')) return 'Document';
  if (lowerTitle.includes('biography') || lowerTitle.includes('biographical')) return 'Biography';
  if (lowerTitle.includes('history') || lowerUrl.includes('history')) return 'Historical Account';
  if (lowerTitle.includes('essay') || lowerTitle.includes('article')) return 'Essay/Article';
  
  return 'Historical Material';
}

inferHistoricalPeriod(title) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('kirtland')) return 'Kirtland Period (1831-1837)';
  if (lowerTitle.includes('missouri')) return 'Missouri Period (1831-1839)';
  if (lowerTitle.includes('nauvoo')) return 'Nauvoo Period (1839-1846)';
  if (lowerTitle.includes('pioneer') || lowerTitle.includes('utah')) return 'Pioneer Period (1847-1877)';
  if (lowerTitle.includes('martyrdom') || lowerTitle.includes('carthage')) return 'Martyrdom Period (1844)';
  if (lowerTitle.includes('restoration') || lowerTitle.includes('organization')) return 'Restoration Period (1820-1831)';
  
  return 'Church History';
}

getHistoricalSourceBreakdown(results) {
  const breakdown = { history: 0, press: 0, jspapers: 0 };
  results.forEach(result => {
    const link = result.document.derivedStructData.fields.link.stringValue;
    if (link.includes('history.churchofjesuschrist.org')) breakdown.history++;
    else if (link.includes('churchhistorianspress.org')) breakdown.press++;
    else if (link.includes('josephsmithpapers.org')) breakdown.jspapers++;
  });
  return breakdown;
}

// Specialized search methods
async searchJosephSmithPapers(query) {
  const filter = 'siteSearch:"josephsmithpapers.org" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")';
  return this.searchChurchHistory(query, { customFilter: filter });
}

async searchByHistoricalPeriod(query, period) {
  const periodTerms = {
    'restoration': 'restoration organization 1820 1830 vision plates',
    'kirtland': 'Kirtland Ohio temple endowment 1831 1837',
    'missouri': 'Missouri Jackson Independence 1831 1839',
    'nauvoo': 'Nauvoo Illinois temple 1839 1846',
    'martyrdom': 'martyrdom Carthage jail 1844',
    'pioneer': 'pioneer Utah Salt Lake valley 1847 Brigham Young'
  };
  
  const enhancedQuery = periodTerms[period] 
    ? `${query} ${periodTerms[period]}` 
    : query;
    
  return this.searchChurchHistory(enhancedQuery);
}

async searchByDocumentType(query, documentType) {
  const documentTerms = {
    'revelation': 'revelation received Lord commandment',
    'letter': 'letter correspondence written to',
    'journal': 'journal diary personal record',
    'discourse': 'discourse sermon speech address',
    'minutes': 'minutes meeting conference council'
  };
  
  const enhancedQuery = documentTerms[documentType] 
    ? `${query} ${documentTerms[documentType]}` 
    : query;
    
  return this.searchChurchHistory(enhancedQuery);
}
```

## Usage Examples

### Foundational Events
```javascript
// Search for fundamental historical events
const firstVision = await client.searchChurchHistory('"First Vision" 1820 grove');
const restoration = await client.searchChurchHistory('restoration priesthood keys authority');
const bookOfMormon = await client.searchChurchHistory('"Book of Mormon" translation plates');

// Organization and early Church
const organization = await client.searchChurchHistory('church organization 1830 April');
const earlyMissionaries = await client.searchChurchHistory('early missionaries first missions');
```

### Historical Periods
```javascript
// Kirtland period (1831-1837)
const kirtlandTemple = await client.searchByHistoricalPeriod('temple construction', 'kirtland');
const schoolOfProphets = await client.searchChurchHistory('"School of the Prophets" Kirtland');

// Nauvoo period (1839-1846)
const nauvooTemple = await client.searchByHistoricalPeriod('temple endowment', 'nauvoo');
const reliefSociety = await client.searchChurchHistory('"Relief Society" organization Nauvoo');

// Pioneer period (1847-1877)
const pioneerJourney = await client.searchByHistoricalPeriod('migration west', 'pioneer');
const utahSettlement = await client.searchChurchHistory('Utah settlement colonization');
```

### Key Historical Figures
```javascript
// Joseph Smith documentation
const josephSmithRevelations = await client.searchJosephSmithPapers('revelation received');
const josephSmithLetters = await client.searchByDocumentType('Joseph Smith correspondence', 'letter');

// Early Church leaders
const brighamYoung = await client.searchChurchHistory('"Brigham Young" leadership pioneer');
const hyrum = await client.searchChurchHistory('"Hyrum Smith" patriarch martyrdom');
const oliver = await client.searchChurchHistory('"Oliver Cowdery" witness scribe');
```

### Document Types
```javascript
// Revelations and divine communications
const revelations = await client.searchByDocumentType('doctrine covenants', 'revelation');
const visions = await client.searchChurchHistory('vision dream revelation divine');

// Personal records and journals
const journals = await client.searchByDocumentType('personal experiences', 'journal');
const diaries = await client.searchChurchHistory('daily record personal diary');

// Official Church documents
const minutes = await client.searchByDocumentType('conference decisions', 'minutes');
const discourses = await client.searchByDocumentType('preaching teaching', 'discourse');
```

### Scholarly Research
```javascript
// Academic and research topics
const doctrinalDevelopment = await client.searchChurchHistory('doctrine development evolution understanding');
const historicalContext = await client.searchChurchHistory('historical context background setting');

// Primary source materials
const originalDocuments = await client.searchChurchHistory('original manuscript handwriting authentic');
const eyewitnessAccounts = await client.searchChurchHistory('eyewitness testimony firsthand account');
```

## Content Coverage

### Church History Department (history.churchofjesuschrist.org):
- **Official Church History** - Comprehensive historical narratives
- **Biographical Sketches** - Lives of early Church leaders and members
- **Historical Context** - Background information for major events
- **Timeline Resources** - Chronological organization of events
- **Educational Materials** - Teaching resources for Church history
- **Multimedia Content** - Maps, images, and interactive resources

### Church Historian's Press (churchhistorianspress.org):
- **Scholarly Publications** - Academic books and research
- **Document Collections** - Edited historical document series
- **Research Articles** - Peer-reviewed historical analysis
- **Critical Editions** - Carefully edited primary sources
- **Bibliography Resources** - Research guides and source lists
- **Publication Announcements** - New releases and project updates

### Joseph Smith Papers (josephsmithpapers.org):
- **Personal Documents** - Joseph Smith's letters, journals, and records
- **Revelations** - Original contexts and manuscript information
- **Business Records** - Financial and legal documents
- **Family Letters** - Correspondence with family members
- **Legal Documents** - Court records and legal proceedings
- **Contemporary Accounts** - Records from Joseph Smith's associates

### Document Categories:

**Primary Sources:**
- Original manuscripts and documents
- Contemporary letters and correspondence
- Meeting minutes and official records
- Personal journals and diaries
- Legal documents and contracts

**Secondary Sources:**
- Historical analysis and interpretation
- Biographical studies and profiles
- Contextual background information
- Scholarly essays and articles
- Educational materials and summaries

**Research Tools:**
- Chronological timelines
- Geographical maps and locations
- Genealogical information
- Citation guides and bibliographies
- Cross-reference systems

## Testing Information

### cURL Testing Commands
```bash
# Multi-domain Church history search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=web&filter=(siteSearch%3A%22history.churchofjesuschrist.org%22%20OR%20siteSearch%3A%22churchhistorianspress.org%22%20OR%20siteSearch%3A%22josephsmithpapers.org%22)%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)&orderBy="

# Joseph Smith Papers specific
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=revelation%20doctrine&start=1&searchType=web&filter=siteSearch%3A%22josephsmithpapers.org%22&orderBy="
```

## Research Applications

### Academic Research:
- **Dissertation Topics** - Primary source material for scholarly work
- **Historical Analysis** - Multiple perspectives on events and developments
- **Doctrinal Studies** - Evolution of Church doctrine and understanding
- **Biographical Research** - Comprehensive information on historical figures
- **Contextual Studies** - Social, cultural, and religious background

### Educational Use:
- **Seminary and Institute** - Historical context for curriculum
- **University Courses** - Primary sources for religious studies
- **Personal Study** - Enhanced understanding of Church development
- **Family History** - Connection to early Church members and events
- **Missionary Preparation** - Historical foundation for teaching

### Apologetic Research:
- **Historical Accuracy** - Verification of events and circumstances
- **Contemporary Context** - Understanding of 19th-century religious environment
- **Source Criticism** - Evaluation of historical claims and evidence
- **Scholarly Dialogue** - Academic engagement with critics and historians

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Academic language barriers | Scholarly terminology difficult to understand | Use simpler terms or search for educational summaries |
| Information overload | Too many detailed results | Use specific names, dates, or events to narrow search |
| Source authenticity questions | Uncertainty about document reliability | Cross-reference across multiple sources and check editorial notes |
| Limited accessibility | Complex academic formats | Look for summaries or educational adaptations |

## Research Standards

### Source Evaluation:
- **Primary vs. Secondary** - Distinguish between original documents and interpretations
- **Editorial Quality** - Consider scholarly editing and annotation standards
- **Publication Standards** - Recognize peer-reviewed vs. popular publications
- **Bias Awareness** - Understand historical and contemporary perspectives
- **Cross-Verification** - Compare information across multiple sources

### Citation Guidelines:
- **Proper Attribution** - Credit original sources and editors
- **Version Control** - Note digital publication dates and updates
- **Access Information** - Include URLs and access dates for digital resources
- **Context Preservation** - Maintain historical and editorial context

## Notes

- **Multi-Domain Integration**: Searches across three major Church history repositories
- **Scholarly Standards**: Content meets academic research and publication standards
- **Primary Source Focus**: Emphasizes original documents and contemporary accounts
- **Editorial Excellence**: Professional editing and annotation of historical materials
- **Research Accessibility**: Makes scholarly materials available to general audiences
- **Historical Accuracy**: Commitment to factual precision and contextual understanding
- **Global Perspective**: Includes international Church history and development
- **Ongoing Research**: Regularly updated with new discoveries and publications
- **Digital Innovation**: Leading-edge presentation of historical materials online
- **Educational Mission**: Supports both scholarly research and popular education

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [General Conference Search](general-conference-search.md) - Historical conference addresses
- [Scripture Search](scripture-search.md) - Scriptural context for historical events
- [Newsroom Search](newsroom-search.md) - Contemporary Church news and announcements