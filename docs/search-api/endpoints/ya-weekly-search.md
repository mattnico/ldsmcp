# YA Weekly Search: `/search/proxy/vertex-search` (Young Adult Filter)

Search within YA Weekly content designed specifically for young adults with optional year filtering for current and historical content.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/vertex-search`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Infrastructure:** Google Vertex AI Search (Enterprise Search)
- **Purpose:** Search within YA Weekly articles, stories, and young adult-focused resources

## Query Syntax

### Search Query Types

**Exact Phrase Search (Quoted)**
```javascript
q: '"dating in college"'           // Finds specific young adult topics
q: '"mission preparation"'         // Finds exact guidance topics
q: '"career decisions"'            // Finds specific life stage content
```

**Fuzzy/Broad Search (Unquoted)**
```javascript
q: 'college university education'  // Finds various education-related content
q: 'mission preparation serving'   // Finds mission-related articles
q: 'relationships dating marriage' // Finds relationship guidance
```

## Parameters

### Required Parameters
```typescript
interface YAWeeklySearchParams {
  q: string;           // Search query text
  start: number;       // Starting result index (1-based)
  searchType: "web";   // Fixed value for text search
  filter: string;      // YA Weekly directory filter with optional year filtering
  orderBy?: string;    // Sort order (empty string for relevance)
}
```

### Filter Options

**All YA Weekly Content (Default)**
```javascript
filter: 'siteSearch:"churchofjesuschrist.org/study/ya-weekly/*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")'
```

**Specific Year (e.g., 2024)**
```javascript
filter: 'siteSearch:"churchofjesuschrist.org/study/ya-weekly/2024" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")'
```

## Code Integration

### JavaScript Implementation
```javascript
async searchYAWeekly(query, options = {}) {
  let filter;
  
  if (options.year) {
    // Filter by specific year
    filter = `siteSearch:"churchofjesuschrist.org/study/ya-weekly/${options.year}" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"`;
  } else {
    // All YA Weekly content
    filter = 'siteSearch:"churchofjesuschrist.org/study/ya-weekly/*" AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*") AND -siteSearch:"*imageView=*" AND -siteSearch:"*adbid=*" AND -siteSearch:"*adbpl=*" AND -siteSearch:"*adbpr=*" AND -siteSearch:"*cid=*" AND -siteSearch:"*short_code=*" AND -siteSearch:"news-my.churchofjesuschrist.org/article/women-can-and-should-change-the-world-says-relief-society-general-president-camille-n-johnson"';
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
          contentType: 'ya-weekly',
          metadata: {
            year: this.extractYear(fields.link.stringValue),
            week: this.extractWeek(fields.link.stringValue),
            topic: this.inferTopic(fields.title.stringValue),
            displayLink: fields.displayLink?.stringValue
          }
        };
      }),
      pagination: { total: data.totalSize, nextPageToken: data.nextPageToken, start: options.start || 1 },
      searchType: 'ya-weekly',
      filterYear: options.year || 'all-years'
    };
  } catch (error) {
    return { error: { message: error.message, code: 'FETCH_ERROR' } };
  }
}

extractYear(url) {
  const yearMatch = url.match(/\/ya-weekly\/(\d{4})/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

extractWeek(url) {
  const weekMatch = url.match(/\/ya-weekly\/\d{4}\/(\d{2})/);
  return weekMatch ? parseInt(weekMatch[1]) : null;
}

inferTopic(title) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('dating') || lowerTitle.includes('relationship')) return 'Relationships';
  if (lowerTitle.includes('mission') || lowerTitle.includes('serving')) return 'Mission Preparation';
  if (lowerTitle.includes('college') || lowerTitle.includes('education')) return 'Education';
  if (lowerTitle.includes('career') || lowerTitle.includes('work')) return 'Career Development';
  if (lowerTitle.includes('marriage') || lowerTitle.includes('eternal')) return 'Marriage Preparation';
  if (lowerTitle.includes('testimony') || lowerTitle.includes('faith')) return 'Spiritual Development';
  if (lowerTitle.includes('service') || lowerTitle.includes('helping')) return 'Service';
  if (lowerTitle.includes('family') || lowerTitle.includes('parents')) return 'Family Relationships';
  
  return 'General Guidance';
}

// Convenience methods
async searchYACurrent(query) {
  const currentYear = new Date().getFullYear();
  return this.searchYAWeekly(query, { year: currentYear });
}

async searchYA2024(query) {
  return this.searchYAWeekly(query, { year: 2024 });
}

async searchYAByTopic(query, topic) {
  const topicTerms = {
    'relationships': 'dating relationships love marriage eternal',
    'mission': 'mission missionary serve serving preparation call',
    'education': 'college university education learning school career',
    'spiritual': 'testimony faith prayer scripture study spiritual',
    'family': 'family parents siblings home relationships',
    'service': 'service helping others community volunteer',
    'career': 'career work job employment professional development'
  };
  
  const enhancedQuery = topicTerms[topic] 
    ? `${query} ${topicTerms[topic]}` 
    : query;
    
  return this.searchYAWeekly(enhancedQuery);
}
```

## Usage Examples

### Current Content
```javascript
// Search current year's YA Weekly
const currentGuidance = await client.searchYACurrent('dating relationships');
const missionPrep = await client.searchYACurrent('mission preparation call');

// Search 2024 specific content
const year2024 = await client.searchYA2024('college education career');
```

### Topic-Focused Searches
```javascript
// Relationship and dating guidance
const relationshipAdvice = await client.searchYAByTopic('boundaries standards', 'relationships');
const datingGuidance = await client.searchYAWeekly('"dating standards" young adults');

// Mission preparation
const missionPrep = await client.searchYAByTopic('preparation call', 'mission');
const missionarySkills = await client.searchYAWeekly('missionary skills language learning');

// Education and career
const collegeGuidance = await client.searchYAByTopic('choosing major', 'education');
const careerAdvice = await client.searchYAByTopic('job interview skills', 'career');
```

### Life Transition Support
```javascript
// Leaving home and independence
const independentLiving = await client.searchYAWeekly('living away from home college dorms');
const adultResponsibilities = await client.searchYAWeekly('adult responsibilities financial independence');

// Spiritual development in young adulthood
const testimoneyBuilding = await client.searchYAWeekly('testimony doubts questions faith');
const spiritualGrowth = await client.searchYAWeekly('personal revelation young adults');
```

### Social and Cultural Topics
```javascript
// Social media and technology
const digitalLife = await client.searchYAWeekly('social media boundaries healthy technology');
const onlineDating = await client.searchYAWeekly('online dating apps relationships');

// Mental health and wellness
const mentalHealth = await client.searchYAWeekly('anxiety depression mental health young adults');
const stressManagement = await client.searchYAWeekly('stress college work balance');
```

## Content Coverage

### YA Weekly Topic Areas:
- **Relationships and Dating** - Navigation of romantic relationships with gospel standards
- **Mission Preparation** - Spiritual, physical, and practical mission preparation
- **Education and Career** - College choices, career development, and professional goals
- **Spiritual Development** - Personal testimony, prayer, scripture study for young adults
- **Family Relationships** - Maintaining family connections while gaining independence
- **Financial Responsibility** - Budgeting, debt management, and financial planning
- **Social Issues** - Navigating contemporary social and cultural challenges
- **Mental Health** - Emotional wellness and stress management for young adults
- **Service and Leadership** - Opportunities for meaningful service and leadership development
- **Marriage Preparation** - Understanding eternal marriage and preparation for temple marriage

### Content Types:
- **Weekly Lessons** - Structured gospel learning appropriate for young adult schedules
- **Personal Stories** - Real experiences from young adults worldwide
- **Practical Guidance** - Actionable advice for common young adult challenges
- **Doctrinal Insights** - Gospel principles applied to young adult life circumstances
- **Discussion Questions** - Materials suitable for young adult groups and classes
- **Activity Ideas** - Social and service activities for young adult groups
- **Expert Advice** - Counsel from Church leaders and professional experts
- **Multimedia Resources** - Videos, podcasts, and interactive content

### Target Audience Characteristics:
- **Age Range**: Approximately 18-30 years old
- **Life Circumstances**: College students, young professionals, single adults, young married couples
- **Unique Challenges**: Independence, career decisions, relationship navigation, spiritual development
- **Learning Preferences**: Digital-first, practical application, peer stories, flexible formats

## Testing Information

### cURL Testing Commands
```bash
# All YA Weekly content search
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=RESTORATION&start=1&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fya-weekly%2F*%22%20AND%20(siteSearch%3A%22*lang%3Deng*%22%20OR%20-siteSearch%3A%22*lang%3D*%22)&orderBy="

# 2024 specific content
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/vertex-search?q=dating%20relationships&start=1&searchType=web&filter=siteSearch%3A%22churchofjesuschrist.org%2Fstudy%2Fya-weekly%2F2024%22&orderBy="
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Limited historical content | Few results for older years | YA Weekly may be relatively new, focus on recent years |
| Content overlap with other resources | Similar results in multiple searches | YA Weekly specifically targets young adult perspective |
| Too general for specific situations | Broad advice not applicable to personal situation | Combine searches or look for personal story examples |
| Academic year mismatch | Content timing doesn't match school calendar | Consider searching across multiple months or years |

## Content Philosophy

### YA Weekly Approach:
- **Relevant Application**: Addresses real-world challenges facing young adults
- **Gospel Integration**: Connects eternal principles with contemporary circumstances  
- **Peer Learning**: Emphasizes learning from other young adults' experiences
- **Practical Wisdom**: Provides actionable guidance rather than theoretical concepts
- **Cultural Awareness**: Acknowledges diverse backgrounds and life circumstances
- **Digital Native**: Designed for generation comfortable with online learning
- **Flexible Format**: Accommodates varying schedules and attention spans
- **Community Building**: Encourages connection with other young adults

### Unique Value Proposition:
- **Age-Specific**: Content specifically designed for young adult developmental stage
- **Contemporary Relevance**: Addresses current cultural and social realities
- **Balanced Perspective**: Combines spiritual guidance with practical life skills
- **Global Perspective**: Represents diverse young adult experiences worldwide
- **Expert Integration**: Combines peer wisdom with professional and ecclesiastical counsel

## Notes

- **Young Adult Focus**: Specifically designed for 18-30 age demographic
- **Contemporary Issues**: Addresses modern challenges unique to young adults
- **Digital-First**: Designed for online consumption and sharing
- **Cultural Sensitivity**: Acknowledges diverse young adult experiences globally
- **Practical Application**: Emphasizes actionable guidance over theoretical concepts
- **Peer Learning**: Heavy emphasis on young adult stories and experiences
- **Professional Integration**: Balances spiritual and practical career guidance
- **Relationship Navigation**: Significant focus on healthy relationship development
- **Independence Support**: Helps navigate transition from dependence to independence
- **Community Connection**: Designed to combat isolation common in young adult years

## Related Documentation

- [Vertex Search](vertex-search.md) - Base endpoint documentation
- [For the Strength of Youth Search](for-the-strength-of-youth-search.md) - Younger audience guidance
- [Liahona Search](liahona-search.md) - Magazine content including young adult articles
- [Children's Content Search](children-content-search.md) - Contrast with younger audience content