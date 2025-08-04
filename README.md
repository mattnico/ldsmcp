# Gospel Library MCP Server (DXT)

Intelligent MCP server for accessing LDS Church Gospel Library content with AI-powered search routing and comprehensive endpoint coverage.

## 🚀 **Key Features**

- **🧠 AI-Powered Search Intelligence**: Automatically routes queries to optimal Gospel Library search endpoints
- **🔍 18+ Specialized Search APIs**: Complete coverage of Gospel Library search capabilities
- **📖 Direct Content Access**: Fetch any Gospel Library content via URI with rich metadata
- **🎯 Smart Query Analysis**: Detects content types, speakers, dates, and scripture references
- **🏗️ Desktop Extension**: Native Claude Desktop integration with manifest-based architecture

## 📦 Installation

### Claude Desktop Extension (Recommended)
1. Download the latest `.dxt` file from releases
2. Open Claude Desktop
3. Go to Extensions → Install Extension
4. Select the downloaded `.dxt` file
5. The extension installs automatically - no setup required!

### Manual Development Setup
```bash
git clone https://github.com/mattnico/ldsmcp.git
cd ldsmcp/server
npm install
npm run build
```

## 🔧 Available Tools

### Smart Search
- **`search_gospel_library`** - AI-powered search with automatic endpoint routing
  - Analyzes query intent and content type
  - Routes to optimal search endpoint automatically
  - Supports comprehensive, smart, and specific search modes

### Specialized Searches
- **`search_general_conference`** - Conference talks with speaker/date filtering
- **`search_scriptures`** - Verse-level scripture search with collection filtering  
- **`search_archive`** - Comprehensive search across all Gospel Library content
- **`search_seminary`** - Seminary and institute manual search with lesson number support
- **`search_vertex`** - Multi-type search (web, image, video, music, PDF)

### Content Tools
- **`fetch_content`** - Get full content from specific Gospel Library URIs
- **`browse_structure`** - Navigate content hierarchies and table of contents
- **`fetch_media`** - Extract audio, video, and image URLs from content

### Discovery Tools
- **`explore_endpoints`** - Discover and validate Gospel Library API endpoints

## 📖 Usage Examples

### Smart Search (Recommended)
```javascript
{
  "tool": "search_gospel_library",
  "parameters": {
    "query": "Russell M. Nelson faith hope charity",
    "searchMode": "smart"
  }
}
```

### Browse Recent General Conference
```javascript
{
  "tool": "browse_structure",
  "parameters": {
    "uri": "/general-conference/2024/10",
    "depth": 2
  }
}
```

### Get Specific Content
```javascript
{
  "tool": "fetch_content",
  "parameters": {
    "uri": "/scriptures/bofm/alma/32"
  }
}
```

### Search Scriptures Specifically
```javascript
{
  "tool": "search_scriptures",
  "parameters": {
    "query": "faith hope charity",
    "collectionName": "The Book of Mormon"
  }
}
```

### Seminary Lesson Planning
```javascript
{
  "tool": "search_seminary",
  "parameters": {
    "query": "lesson 107",
    "subject": "doctrine-and-covenants",
    "lessonNumber": 107
  }
}
```

### Smart Search for Seminary Content
```javascript
{
  "tool": "search_gospel_library",
  "parameters": {
    "query": "seminary lesson 107 D&C manual teaching ideas",
    "searchMode": "smart"
  }
}
```

## 🧠 Search Intelligence

The server includes sophisticated query analysis that:
- **Detects Content Types**: Scripture references, conference talks, manual content
- **Identifies Intent**: Speaker names, date ranges, book names, topics
- **Routes Intelligently**: Selects optimal endpoint based on confidence scoring
- **Provides Fallbacks**: Tries alternative endpoints if primary search fails

### Search Modes
- **`smart`** (default): AI selects best endpoint automatically
- **`comprehensive`**: Searches multiple endpoints and combines results  
- **`specific`**: Forces use of a particular endpoint

## 🚀 Performance Benefits

- **No Database Required**: Direct API access eliminates setup complexity
- **Real-Time Results**: Always current content without crawling delays
- **Lightweight**: Minimal dependencies, fast startup
- **Intelligent Caching**: Smart request optimization reduces API calls

## 📚 API Documentation

Comprehensive documentation available in `docs/search-api/`:
- **Complete Endpoint Reference**: All 18+ Gospel Library search APIs
- **Integration Patterns**: Code examples and best practices
- **Implementation Guide**: Roadmap and testing strategies

## 🛠️ Development

### Building
```bash
cd server/
npm install
npm run build
```

### Testing with MCP Inspector
```bash
npm run inspect
```

### Available Commands
- `npm run dev` - Development with hot reload
- `npm run build` - Compile TypeScript and set permissions  
- `npm run inspect` - Launch MCP Inspector for testing

## 🔗 Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Desktop Extension Specification](https://github.com/anthropics/dxt)
- [Gospel Library Search API Documentation](./docs/search-api/README.md)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Issues and pull requests welcome at the [GitHub repository](https://github.com/mattnico/ldsmcp).