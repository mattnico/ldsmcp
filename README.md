# LDS MCP Server

An MCP (Model Context Protocol) server for accessing content from the Church of Jesus Christ of Latter-day Saints Gospel Library.

## Features

- **Fetch Content**: Retrieve any Gospel Library content by URI
- **Search**: Search across scriptures, conference talks, manuals, and more
- **Explore API**: Discover available endpoints and content types
- **Resources**: Quick access to common content like latest conference talks and scriptures

## Installation

```bash
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ldsmcp": {
      "command": "node",
      "args": ["/path/to/ldsmcp/build/index.js"]
    }
  }
}
```

### Testing with MCP Inspector

```bash
npm run inspect
```

## Available Tools

### fetch_content
Fetch any Gospel Library content by URI.

**Parameters:**
- `uri` (required): The content URI (e.g., "/scriptures/bofm/1-ne/1")
- `lang` (optional): Language code (default: "eng")
- `includeHtml` (optional): Include raw HTML (default: false)

**Example:**
```
fetch_content uri="/general-conference/2025/04/13holland"
```

### search_gospel_library
Search for content across the Gospel Library.

**Parameters:**
- `query` (required): Search terms
- `contentType` (optional): Filter by type (scriptures, general-conference, manuals, magazines)
- `limit` (optional): Max results (default: 10)

**Example:**
```
search_gospel_library query="faith" contentType="scriptures"
```

### explore_endpoints
Discover available API endpoints.

**Parameters:**
- `baseUri` (optional): Starting URI for exploration
- `patterns` (optional): Custom URI patterns to test
- `depth` (optional): Exploration depth (default: 1)

**Example:**
```
explore_endpoints baseUri="/scriptures"
```

## Available Resources

- `gospel-library://conference/latest` - Latest General Conference
- `gospel-library://scriptures/bofm` - Book of Mormon
- `gospel-library://scriptures/dc-testament` - Doctrine and Covenants
- `gospel-library://manual/come-follow-me` - Come, Follow Me materials

## Common URI Patterns

### Scriptures
- `/scriptures/bofm/1-ne/1` - 1 Nephi chapter 1
- `/scriptures/dc-testament/dc/76` - D&C Section 76
- `/scriptures/nt/matt/5` - Matthew chapter 5

### General Conference
- `/general-conference/2025/04` - April 2025 conference
- `/general-conference/2025/04/13holland` - Specific talk

### Manuals
- `/manual/come-follow-me-for-individuals-and-families-book-of-mormon-2024`
- `/study/manual/gospel-topics`

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Test with MCP Inspector
npm run inspect
```

## API Information

The Gospel Library API endpoint:
```
https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=eng&uri={uri}
```

No authentication is required.

## License

MIT