# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Commands
- `npm run dev` - Run TypeScript files directly with hot reload using tsx
- `npm run build` - Compile TypeScript to JavaScript and set executable permissions
- `npm run inspect` - Test the MCP server with the official MCP Inspector
- `npm install` - Install dependencies (lightweight - no native dependencies)

### Testing Search Tools
When testing tools during development, use the MCP Inspector:
```bash
npm run inspect
# Then use the inspector UI to test search tools like:
# - search_gospel_library with query="faith" (uses AI routing)
# - search_general_conference with query="plan of salvation" speaker="russell-m-nelson"
# - search_scriptures with query="faith" collectionName="The Book of Mormon"
# - search_archive with query="temple" source=47 (General Conference)
# - search_vertex with query="restoration" searchType="video"
# - fetch_content with uri="/scriptures/bofm/1-ne/1"
# - browse_structure with uri="/general-conference/2024/10" depth=2
```

## Architecture Overview

### Intelligent Search MCP Server
This is a Model Context Protocol (MCP) server that provides intelligent search across Gospel Library content using AI-powered endpoint routing and 18+ specialized search APIs. The server uses stdio transport for communication with MCP clients.

### Core Components

1. **API Client (`src/api/client.ts`)**
   - Singleton instance wraps the Gospel Library API
   - Handles all HTTP requests to various Gospel Library search endpoints
   - Provides HTML parsing and content extraction utilities
   - No authentication required

2. **Smart Search System (`src/tools/search/`)**
   - **Search Intelligence (`search-intelligence.ts`)** - AI-powered query analysis and endpoint routing
   - **General Conference Search** - Optimized conference talk search with date/speaker filtering
   - **Scripture Search** - Verse-level search with collection filtering
   - **Archive Search** - Comprehensive search across all Gospel Library collections
   - **Vertex Search** - Multi-type search (web, image, video, music, PDF)
   - **Specialized Searches** - Come Follow Me, General Handbook, and other focused searches

3. **Core Tools (`src/tools/`)**
   - **Smart Search (`search.ts`)** - Main search tool with intelligent routing
   - **Content Fetching (`fetch.ts`)** - Direct URI-based content retrieval
   - **Structure Browsing (`browse.ts`)** - Navigate content hierarchies
   - **Media Extraction (`media.ts`)** - Extract audio/video/image URLs
   - **Endpoint Discovery (`explore.ts`)** - API endpoint discovery and validation

4. **Resource System (`src/resources/content.ts`)**
   - Provides predefined URIs for common content (latest conference, scriptures)
   - Resources use custom URI scheme: `gospel-library://`
   - Read operations fetch and cache content on demand

### Search Intelligence Features

#### AI-Powered Query Analysis
The search intelligence engine analyzes queries for:
- **Content Type Detection** - Scripture, conference, manual, magazine, media patterns
- **Intent Recognition** - Speaker names, date references, book names, scripture references
- **Endpoint Routing** - Automatically selects optimal search endpoint with confidence scoring
- **Fallback Handling** - Tries alternative endpoints if primary search fails

#### Search Modes
- **Smart Mode (default)** - Uses AI routing to automatically select best endpoint
- **Comprehensive Mode** - Searches multiple endpoints and combines results
- **Specific Mode** - Forces use of a particular endpoint

#### Search Endpoints Available
1. **General Conference Search** - POST endpoint with optimized date filtering (April/October only)
2. **Scripture Search** - Verse-level search with collection and testament filtering
3. **Archive Search** - Comprehensive search across all Gospel Library collections
4. **Vertex Search** - Multi-type Google Vertex AI search (web, image, video, music, PDF)
5. **Specialized Searches** - Come Follow Me, General Handbook, Newsroom, etc.

### API Endpoint Types and Response Structures

#### Content Endpoint (`/type/content`)
Returns actual readable text content:
- `meta`: Contains title, contentType, publication info, media URLs
- `content.body`: HTML content of the document
- `content.footnotes`: Array of scripture references and notes
- `error`: Present only on failures

#### Dynamic Endpoint (`/type/dynamic`)  
Returns structured navigation and metadata:
- `content`: Hierarchical object with organized content items
- `toc`: Table of contents structure
- `pids`: Resource identifiers
- `uri`: Original request URI
- `verified`/`restricted`: Status flags
- `error`: Present only on failures

#### Search Endpoints
Multiple specialized search endpoints documented in `/docs/search-api/`:
- **POST** `/search/proxy/general-conference-search` - Conference talks
- **GET** `/search/proxy/vertex-search` - Multi-type Vertex AI search
- **GET** `/search/proxy/vertex-scripture-search` - Scripture verses
- **GET** `/search/proxy/content-search-service` - Archive search
- **GET** `/search/proxy/newsroom-search` - Church newsroom
- And 13+ other specialized endpoints

### URI Patterns
URIs follow predictable patterns:
- Scriptures: `/scriptures/{book}/{chapter}` (e.g., `/scriptures/bofm/alma/32`)
- Conference: `/general-conference/{year}/{month}/{speaker}` 
- Manuals: `/manual/{manual-name}` or `/study/manual/{topic}`

### Search API Documentation
For comprehensive documentation on Gospel Library search endpoints, see:
- **Main Documentation:** `/docs/search-api/README.md` - Complete overview and navigation
- **Endpoint Documentation:** `/docs/search-api/endpoints/` - Individual endpoint details
- **Integration Patterns:** `/docs/search-api/reference/integration-patterns.md` - Code examples and best practices
- **Implementation Guide:** `/docs/search-api/implementation/` - Roadmap and testing strategies

### Performance Benefits
- **No Database Dependencies** - Eliminated SQLite3 and native compilation requirements
- **Real-Time Results** - Always current content without crawling/indexing delays
- **Lightweight Deployment** - Minimal dependencies and fast startup
- **Intelligent Routing** - Optimal endpoint selection reduces unnecessary API calls

## Desktop Extension (DXT) Development

### Extension Development Guidelines
- **Architecture Specification**: Follow the Desktop Extension (DXT) architecture guidelines
  - Review DXT specification: https://github.com/anthropics/dxt/blob/main/README.md
  - Study complete extension manifest structure: https://github.com/anthropics/dxt/blob/main/MANIFEST.md
  - Explore reference implementations: https://github.com/anthropics/dxt/tree/main/examples

### Key Development Practices
- Implement MCP server using @modelcontextprotocol/sdk
- Create valid manifest.json following MANIFEST.md specifications
- Use stdio transport for MCP protocol communication
- Implement robust error handling and timeout management
- Include comprehensive logging and debugging capabilities
- Validate tool responses and manifest loading
- Focus on defensive programming and clear error messages