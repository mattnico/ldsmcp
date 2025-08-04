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
Fetch any Gospel Library content by URI (returns actual readable text).

**Parameters:**
- `uri` (required): The content URI (e.g., "/scriptures/bofm/1-ne/1")
- `lang` (optional): Language code (default: "eng")
- `includeHtml` (optional): Include raw HTML (default: false)

**Example:**
```
fetch_content uri="/general-conference/2024/10/15nelson"
```

### fetch_media
Extract and fetch audio, video, and image media URLs from Gospel Library content.

**Parameters:**
- `uri` (required): The content URI (e.g., "/general-conference/2024/10/15nelson")
- `lang` (optional): Language code (default: "eng")
- `mediaType` (optional): Filter by media type - 'all', 'audio', 'video', 'image' (default: 'all')
- `quality` (optional): Filter by quality - 'all', '1080p', '720p', '360p' (default: 'all')

**Examples:**
```
fetch_media uri="/general-conference/2025/04/13holland"
fetch_media uri="/general-conference/2025/04/13holland" mediaType="video" quality="1080p"
fetch_media uri="/general-conference/2025/04/13holland" mediaType="audio"
```

**Enhanced Features:**
- **Multiple Quality Levels**: Automatically finds 1080p, 720p, and 360p video versions
- **Audio Support**: Detects MP3 audio in multiple bitrates (128k, 64k)
- **Direct Downloads**: Provides download URLs with `?download=true` parameter
- **Format Detection**: Supports MP4, M3U8 (streaming), MP3, and image formats

### browse_structure
Browse the hierarchical structure and navigation of Gospel Library content.

**Parameters:**
- `uri` (required): The URI to browse (e.g., "/general-conference/2024/10", "/scriptures/bofm")
- `lang` (optional): Language code (default: "eng")
- `depth` (optional): How deep to browse nested structures (default: 1, max: 3)

**Example:**
```
browse_structure uri="/general-conference/2024/10" depth=2
```

### search_gospel_library
Search for content across the Gospel Library.

**Parameters:**
- `query` (required): Search terms
- `contentType` (optional): Filter by type (scriptures, general-conference, manuals, magazines)
- `limit` (optional): Max results (default: 10)
- `searchMode` (optional): 'content' for text search, 'structure' for metadata search, 'both' for combined (default: 'both')

**Example:**
```
search_gospel_library query="faith" contentType="scriptures" searchMode="structure"
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
- `gospel-library://navigation/conference-sessions` - Conference Sessions Navigator
- `gospel-library://navigation/scripture-structure` - Scripture Structure Browser

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

The Gospel Library API has two endpoint types:

### Content Endpoint (for readable text)
```
https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content?lang=eng&uri={uri}
```
Returns the actual text content of articles, scriptures, and talks.

### Dynamic Endpoint (for structure and navigation)
```
https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/dynamic?lang=eng&uri={uri}
```
Returns hierarchical structure, table of contents, and metadata for navigation.

**Key Differences:**
- **Content**: Use for reading actual text (scriptures, talks, articles) and extracting media URLs
- **Dynamic**: Use for browsing structure (conference sessions, scripture books, chapter lists)
- **Performance**: Dynamic is faster for navigation since it doesn't include full text content
- **Metadata**: Dynamic includes thumbnails, speakers, dates, and descriptions
- **Media**: Audio, video, and image URLs are available in content endpoint metadata

## Media Support

The MCP server can extract and provide direct access to:
- **Audio**: Conference talk recordings, music, spoken content
- **Video**: Conference sessions, instructional videos
- **Images**: Illustrations, photographs, diagrams, thumbnails

Media URLs are provided for direct access - no streaming through the MCP server itself.

No authentication is required for either endpoint.

## License

MIT