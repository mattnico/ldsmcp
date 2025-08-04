# Gospel Library MCP Server (DXT)

Enhanced MCP server for accessing LDS Church Gospel Library content with intelligent search and database indexing capabilities.

## 🚀 **New Features**

- **🗄️ Database Indexing**: SQLite-powered content indexing for reliable search
- **🕷️ Intelligent Crawler**: Systematic discovery and indexing of Gospel Library content  
- **🔍 Enhanced Search**: Full-text search with content type, speaker, and year filtering
- **📊 Management Tools**: Database statistics, crawling control, and URI pattern search

## 📦 Installation

### Method 1: Claude Desktop Extension (Recommended)
1. Download the `ldsmcp.dxt` file
2. Open Claude Desktop
3. Go to Extensions and click "Install Extension"
4. Select the `ldsmcp.dxt` file
5. The extension will install automatically

### Method 2: Manual NPM Installation
```bash
npm install -g ldsmcp
```

## 🛠️ Initial Setup

After installation, you need to populate the database with Gospel Library content:

1. **Quick Start (Recent Conferences)**:
   ```
   Use tool: crawl_content
   Parameters: { "mode": "recent-conferences" }
   ```

2. **Full Index (Comprehensive)**:
   ```
   Use tool: crawl_content  
   Parameters: { "mode": "full", "maxDepth": 8 }
   ```

3. **Check Progress**:
   ```
   Use tool: database_stats
   ```

## 🔧 Available Tools

### Core Tools
- **`fetch_content`** - Get content from specific Gospel Library URIs
- **`search_gospel_library`** - Intelligent database-backed search with filters
- **`browse_structure`** - Navigate Gospel Library hierarchy
- **`fetch_media`** - Extract audio, video, and images from content

### Database Management
- **`database_stats`** - View indexing statistics and crawler status
- **`crawl_content`** - Index Gospel Library content (full/incremental/recent)
- **`search_uris`** - Advanced URI pattern and metadata search

### Discovery Tools  
- **`explore_endpoints`** - Discover and validate API endpoints

## 📖 Usage Examples

### Search for President Nelson's Recent Talk
```javascript
// After running initial crawl
{
  "tool": "search_gospel_library",
  "parameters": {
    "query": "Confidence in the Presence of God",
    "speaker": "Nelson",
    "year": 2025
  }
}
```

### Browse 2025 General Conference
```javascript
{
  "tool": "browse_structure", 
  "parameters": {
    "uri": "/general-conference/2025/04",
    "depth": 2
  }
}
```

### Get Database Statistics
```javascript
{
  "tool": "database_stats",
  "parameters": {}
}
```

## 🗃️ Database Location

The SQLite database is created in the server working directory as `gospel_library.db`. This file contains:
- Content metadata and URIs
- Full-text search index
- Navigation hierarchy
- Crawler state and statistics

## ⚡ Performance Notes

- **First Time Setup**: Initial crawl may take 5-15 minutes depending on scope
- **Incremental Updates**: Subsequent crawls are much faster (1-3 minutes)
- **Search Performance**: Database queries are typically under 100ms
- **Storage**: Full index requires ~10-50MB depending on content scope

## 🛠️ Troubleshooting

### Database Issues
- Run `database_stats` to check index status
- Use `crawl_content` with `mode: "incremental"` to refresh
- Delete `gospel_library.db` to reset and re-crawl

### Search Not Working
- Ensure database is populated: `database_stats` should show > 0 records
- Try `searchMode: "fallback"` for legacy search behavior
- Check for recent conference content with targeted crawl

### Performance Issues
- Increase `delayMs` parameter in `crawl_content` to reduce API load
- Use `mode: "incremental"` instead of `"full"` for updates
- Consider `maxDepth` limit for large crawls

## 📝 Development

### Building from Source
```bash
cd server/
npm install
npm run build
```

### Testing
```bash
npm run inspect  # Launch MCP Inspector
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Issues and pull requests welcome at [GitHub repository](https://github.com/mattnicolaysen/ldsmcp).