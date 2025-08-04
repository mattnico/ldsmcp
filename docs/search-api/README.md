# Gospel Library Search API Documentation

This documentation provides comprehensive coverage of Gospel Library search API endpoints, optimized for rapid implementation and AI-assisted development.

## 📊 Status Overview

| Endpoint | Status | Method | File | Primary Use Case |
|----------|--------|---------|------|------------------|
| `/search/proxy/vertex-search` | ✅ Tested & Working | GET | [vertex-search.md](endpoints/vertex-search.md) | Multi-type search (web, image, video, music, PDF) |
| `/search/proxy/general-conference-search` | ✅ Tested & Working | POST | [general-conference-search.md](endpoints/general-conference-search.md) | General Conference talks search |
| `/search/proxy/vertex-scripture-search` | ✅ Tested & Working | GET | [scripture-search.md](endpoints/scripture-search.md) | Verse-level scripture search |
| `/search/proxy/scriptureBooks` | ✅ Tested & Working | GET | [scripture-books.md](endpoints/scripture-books.md) | Scripture book listings |
| `/search/proxy/getSearchStrings` | ✅ Tested & Working | GET | [search-strings.md](endpoints/search-strings.md) | Localized UI strings and facets |
| `/search/proxy/video-metadata` | ✅ Tested & Working | GET | [video-metadata.md](endpoints/video-metadata.md) | Video metadata and download URLs |
| `/search/proxy/newsroom-search` | ✅ Tested & Working | GET | [newsroom-search.md](endpoints/newsroom-search.md) | Church newsroom with date filtering |
| `/search/proxy/content-search-service` | ✅ Tested & Working | GET | [archive-search.md](endpoints/archive-search.md) | Archive search across all Gospel Library collections |

### Specialized Content Searches (Vertex-based)
| Endpoint | Status | Method | File | Primary Use Case |
|----------|--------|---------|------|------------------|
| `vertex-search` (CFM filter) | ✅ Tested & Working | GET | [come-follow-me-search.md](endpoints/come-follow-me-search.md) | Come, Follow Me study materials |
| `vertex-search` (Handbook filter) | ✅ Tested & Working | GET | [general-handbook-search.md](endpoints/general-handbook-search.md) | General Handbook policies/procedures |
| `vertex-search` (Manual filter) | ✅ Tested & Working | GET | [books-lessons-search.md](endpoints/books-lessons-search.md) | All study manuals and lessons |
| `vertex-search` (Liahona filter) | ✅ Tested & Working | GET | [liahona-search.md](endpoints/liahona-search.md) | Liahona magazine with year filtering |
| `vertex-search` (FTSOY filter) | ✅ Tested & Working | GET | [for-the-strength-of-youth-search.md](endpoints/for-the-strength-of-youth-search.md) | For the Strength of Youth guidebook |
| `vertex-search` (Children filter) | ✅ Tested & Working | GET | [children-content-search.md](endpoints/children-content-search.md) | Friend magazine & children's content |
| `vertex-search` (YA filter) | ✅ Tested & Working | GET | [ya-weekly-search.md](endpoints/ya-weekly-search.md) | YA Weekly with year filtering |
| `vertex-search` (History filter) | ✅ Tested & Working | GET | [church-history-search.md](endpoints/church-history-search.md) | Multi-domain Church history archives |
| `vertex-search` (Topics filter) | ✅ Tested & Working | GET | [gospel-topics-search.md](endpoints/gospel-topics-search.md) | Gospel Topics essays & questions |
| `vertex-search` (Welcome filter) | ✅ Tested & Working | GET | [basic-beliefs-search.md](endpoints/basic-beliefs-search.md) | Basic beliefs & investigator content |
| `vertex-search` (BYU filter) | ✅ Tested & Working | GET | [byu-speeches-search.md](endpoints/byu-speeches-search.md) | BYU devotionals & forum addresses |

### Under Investigation
| Endpoint | Status | Method | File | Primary Use Case |
|----------|--------|---------|------|------------------|
| `/search` | ❓ Investigating | GET/POST | - | Full-text content search |
| `/search/structured` | ❔ Unknown | GET | - | Structured content search |
| `/search/suggestions` | ❔ Unknown | GET | - | Search autocomplete/suggestions |

**Status Legend:**
- ✅ **Tested & Working** - Fully documented with working code examples
- ❓ **Investigating** - Found but needs testing and documentation
- ❔ **Unknown** - Suspected to exist but not confirmed
- ❌ **Not Working** - Confirmed non-functional or deprecated

## 🚀 Quick Start

### Basic Integration
```javascript
// Add to your Gospel Library client
const client = new GospelLibraryClient();

// Search General Conference talks (exact phrase vs broad search)
const exactTalks = await client.searchGeneralConference('"plan of salvation"');
const broadTalks = await client.searchGeneralConference('faith hope charity');

// Search scriptures with collection filtering
const verses = await client.searchScriptures('"covenant path"', {
  collectionName: "The Book of Mormon"
});

// Search all content types (web, image, video, music, PDF)
const webResults = await client.searchVertexAI("temple", { searchType: "web" });
const videos = await client.searchVertexAI("restoration", { searchType: "video" });
```

### Specialized Content Searches
```javascript
// Come, Follow Me study materials
const cfmLessons = await client.searchComeFollowMe('"covenant path" discipleship');

// General Handbook policies and procedures
const policies = await client.searchGeneralHandbook('"bishop responsibilities"');

// Church newsroom with date filtering
const recentNews = await client.searchNewsroom('temple dedication', {
  startDate: '2020-01-01T00:00:00.000Z',
  endDate: '2025-01-01T00:00:00.000Z'
});

// Liahona magazine articles (recent years)
const magazineArticles = await client.searchLiahonaRecent('youth faith', 5);

// For the Strength of Youth (2024 edition)
const youthGuidance = await client.searchFTSOY2024('dating standards');

// Children's content (Friend magazine + media + study materials)
const kidsContent = await client.searchChildrenContent('Jesus loves children', { year: 2024 });

// Young Adult Weekly content
const yaGuidance = await client.searchYACurrent('college mission preparation');

// Church history across multiple archives
const historicalDocs = await client.searchChurchHistory('"First Vision" 1820');

// Gospel Topics for doctrinal questions
const doctrinalHelp = await client.searchGospelTopics('salvation grace works');

// Basic beliefs for investigators
const basicInfo = await client.searchBasicBeliefs('what we believe God');

// BYU devotional and forum addresses
const byuSpeeches = await client.searchBYUSpeeches('education faith learning');

// Archive search across all Gospel Library collections
const archiveResults = await client.searchArchive('restoration', {
  source: 47, // General Conference
  author: 'russell-m-nelson',
  dateRange: 'past-10-years'
});
```

### MCP Tool Integration
All endpoints include ready-to-use MCP tool handlers for immediate integration into your MCP server.

## 📁 Documentation Structure

### [Endpoints](endpoints/)
Individual endpoint documentation with complete implementation examples:
- **[Vertex Search](endpoints/vertex-search.md)** - Google Vertex AI multi-type search
- **[General Conference Search](endpoints/general-conference-search.md)** - Conference talks with date filtering
- **[Scripture Search](endpoints/scripture-search.md)** - Verse-level scripture search
- **[Scripture Books](endpoints/scripture-books.md)** - Complete scripture book listings
- **[Search Strings](endpoints/search-strings.md)** - Localized UI strings and content facets
- **[Video Metadata](endpoints/video-metadata.md)** - Video details and download URLs
- **[Archive Search](endpoints/archive-search.md)** - Comprehensive search across all Gospel Library collections

### [Reference](reference/)
Implementation guides and patterns:
- **[Integration Patterns](reference/integration-patterns.md)** - Common integration approaches
- **[Query Syntax](reference/query-syntax.md)** - Search query patterns and examples
- **[Endpoint Template](reference/endpoint-template.md)** - Template for documenting new endpoints

### [Implementation](implementation/)
Development and deployment guides:
- **[Roadmap](implementation/roadmap.md)** - Development phases and priorities
- **[Testing](implementation/testing.md)** - Testing strategies and validation

## 🔍 Search Capabilities

### Search Types
- **Web Search**: Full-text content across all Gospel Library materials
- **Image Search**: Images and visual content with metadata
- **Video Search**: Video content with duration and download URLs
- **Music Search**: Hymns and church music collections
- **PDF Search**: Document search across Church publications
- **Scripture Search**: Verse-level search within scriptures
- **Conference Search**: Targeted search of General Conference talks
- **Archive Search**: Comprehensive search across all Gospel Library collections with advanced filtering

### Advanced Features
- **Date Range Filtering**: Target specific time periods (optimized for conference months)
- **Collection Filtering**: Limit searches to specific content types
- **Language Support**: Multi-language content and UI strings
- **Pagination**: Efficient result paging with tokens
- **Highlighted Snippets**: Search term highlighting in results
- **Metadata Enrichment**: Additional context and media URLs

## 🛠️ Implementation Notes

### For AI Development
- Each endpoint file is self-contained (200-400 lines)
- Consistent template structure across all endpoints
- Ready-to-use code examples for immediate integration
- TypeScript interfaces for type safety

### For Human Developers
- Clear navigation and cross-references
- Comprehensive testing examples with cURL commands
- Troubleshooting guides and common issues
- Performance considerations and best practices

## 📚 Related Documentation

- **[CLAUDE.md](../../CLAUDE.md)** - Main project instructions and architecture
- **[IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md)** - Overall project implementation plan
- **[TEST_COVERAGE_RECOMMENDATIONS.md](../../TEST_COVERAGE_RECOMMENDATIONS.md)** - Testing strategies

## 🤝 Contributing

When documenting new endpoints:
1. Use the [endpoint template](reference/endpoint-template.md)
2. Include complete code examples
3. Add comprehensive testing commands
4. Update the status table above
5. Test all code examples before submitting

## 📄 License

This documentation is part of the LDS MCP project and follows the same licensing terms.