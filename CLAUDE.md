# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Commands
- `npm run dev` - Run TypeScript files directly with hot reload using tsx
- `npm run build` - Compile TypeScript to JavaScript and set executable permissions
- `npm run inspect` - Test the MCP server with the official MCP Inspector
- `npm install` - Install dependencies

### Testing Individual Tools
When testing tools during development, use the MCP Inspector:
```bash
npm run inspect
# Then use the inspector UI to test individual tools like:
# - fetch_content with uri="/scriptures/bofm/1-ne/1"
# - fetch_media with uri="/general-conference/2024/10/15nelson" mediaType="audio"
# - browse_structure with uri="/general-conference/2024/10" depth=2
# - search_gospel_library with query="faith" searchMode="structure"
# - explore_endpoints with baseUri="/scriptures"
```

## Architecture Overview

### MCP Server Structure
This is a Model Context Protocol (MCP) server that exposes Gospel Library content through standardized tools and resources. The server uses stdio transport for communication with MCP clients.

### Core Components

1. **API Client (`src/api/client.ts`)**
   - Singleton instance wraps the Gospel Library API
   - Handles all HTTP requests to `https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content`
   - Provides HTML parsing and content extraction utilities
   - No authentication required

2. **Tool Implementations (`src/tools/`)**
   - Each tool exports an object with `definition` and `handler` properties
   - Tools use `args as any` type assertion in index.ts due to MCP SDK typing constraints
   - All tools return standardized MCP response format with content array
   - `fetch_media` tool extracts audio/video/image URLs from both metadata and HTML content

3. **Resource System (`src/resources/content.ts`)**
   - Provides predefined URIs for common content (latest conference, scriptures)
   - Resources use custom URI scheme: `gospel-library://`
   - Read operations fetch and cache content on demand

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

#### When to Use Each Type
- **Content**: For `fetch_content` tool - getting readable text of specific items
- **Dynamic**: For `browse_structure` tool - exploring navigation structure
- **Search**: Enhanced search uses both endpoints for comprehensive results

### URI Patterns
URIs follow predictable patterns:
- Scriptures: `/scriptures/{book}/{chapter}` (e.g., `/scriptures/bofm/alma/32`)
- Conference: `/general-conference/{year}/{month}/{speaker}` 
- Manuals: `/manual/{manual-name}` or `/study/manual/{topic}`

### Known Limitations
- Search is basic and only checks predefined URI patterns
- No official search API endpoint, so search simulates by fetching known content
- API exploration is limited to discovering linked content within responses