# Video Metadata: `/search/proxy/video-metadata`

Detailed video metadata retrieval including duration, download URLs, and thumbnails for Gospel Library video content.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/video-metadata`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Purpose:** Retrieve detailed video metadata including duration, download URLs, and thumbnails

## Parameters

### Required Parameters
```typescript
interface VideoMetadataParams {
  videoUrl: string;     // URL-encoded video page URL
}
```

### Query Parameters
- **`videoUrl`**: URL-encoded URL of the video page (e.g., `https:%2F%2Fwww.churchofjesuschrist.org%2Fmedia%2Fvideo%2F2018-10-0030-the-restoration-now-you-know%3Flang%3Deng`)

## Response Format

### Success Response Structure
```typescript
interface VideoMetadataResponse {
  title: string;
  description: string;
  thumbnail: string;       // Full-resolution thumbnail URL
  duration: string;        // Format: "MM:SS" or "H:MM:SS"
  videoUrl: string;        // Direct MP4 download URL
  embedUrl: string;        // Original page URL for embedding
  uploadDate: string;      // ISO 8601 timestamp
}
```

### Response Example
```json
{
  "title": "What Is the Restoration?",
  "description": "You may be familiar with \"The Reformation\" as a period of great change within Christianity, \"The Restoration\" is something else entirely. It refers to the full modern-day return of the ancient Church of Jesus Christ.",
  "thumbnail": "https://assets.churchofjesuschrist.org/7b/59/7b59fc89a4b052832bb0b8f874a55f648dd08929/7b59fc89a4b052832bb0b8f874a55f648dd08929.jpeg",
  "duration": "5:13",
  "videoUrl": "https://assets.churchofjesuschrist.org/2bec837310ceecdedbdb054cdabac40cd9e5b71e-1080p-en.mp4",
  "embedUrl": "https://www.churchofjesuschrist.org/media/video/2018-10-0030-the-restoration-now-you-know?lang=eng",
  "uploadDate": "2025-06-12T01:03:58.13946313Z"
}
```

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async fetchVideoMetadata(videoPageUrl) {
  const params = new URLSearchParams({
    videoUrl: videoPageUrl
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/video-metadata?${params}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        error: {
          message: `HTTP error! status: ${response.status}`,
          code: response.status.toString(),
        },
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'FETCH_ERROR',
      },
    };
  }
}

// Enhanced video search with metadata fetching
async searchVideosWithMetadata(query, options = {}) {
  // First, search for videos
  const searchResults = await this.searchVertexAI(query, {
    ...options,
    searchType: 'video'
  });
  
  if (searchResults.error || !searchResults.results) {
    return searchResults;
  }
  
  // Fetch metadata for each video result
  const resultsWithMetadata = await Promise.all(
    searchResults.results.map(async (result) => {
      const metadata = await this.fetchVideoMetadata(result.link);
      return {
        ...result,
        metadata: metadata.error ? null : metadata
      };
    })
  );
  
  return {
    ...searchResults,
    results: resultsWithMetadata
  };
}
```

### MCP Tool Enhancement for Video Search
```javascript
// Enhanced tool handler for video search with metadata
async function handleVideoSearch(args, messageId) {
  const { query, limit = 10, offset = 0 } = args;
  
  try {
    const searchResponse = await gospelLibraryClient.searchVideosWithMetadata(query, {
      start: offset + 1
    });
    
    if (searchResponse.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Error searching videos: ${searchResponse.error.message}`
          }]
        }
      });
      return;
    }

    let resultText = `# Video Search Results for "${query}"\\n\\n`;
    resultText += `Found ${searchResponse.pagination.total} total videos:\\n\\n`;

    searchResponse.results.slice(0, limit).forEach((result, index) => {
      resultText += `## ${index + 1}. ${result.title}\\n`;
      resultText += `**Link:** ${result.link}\\n`;
      
      if (result.metadata) {
        resultText += `**Duration:** ${result.metadata.duration}\\n`;
        resultText += `**Description:** ${result.metadata.description}\\n`;
        resultText += `**Video URL:** ${result.metadata.videoUrl}\\n`;
        resultText += `**Thumbnail:** ${result.metadata.thumbnail}\\n`;
        resultText += `**Upload Date:** ${result.metadata.uploadDate}\\n`;
      }
      
      if (result.snippet) {
        resultText += `**Snippet:** ${result.snippet}\\n`;
      }
      resultText += `\\n`;
    });

    sendMessage({
      jsonrpc: "2.0",
      id: messageId,
      result: {
        content: [{
          type: "text",
          text: resultText
        }]
      }
    });
  } catch (error) {
    sendMessage({
      jsonrpc: "2.0",
      id: messageId,
      result: {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }]
      }
    });
  }
}
```

## Testing Information

### cURL Testing Commands
```bash
# Get metadata for a specific video
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/video-metadata?videoUrl=https:%2F%2Fwww.churchofjesuschrist.org%2Fmedia%2Fvideo%2F2018-10-0030-the-restoration-now-you-know%3Flang%3Deng"

# Get metadata for another video
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/video-metadata?videoUrl=https:%2F%2Fwww.churchofjesuschrist.org%2Fmedia%2Fvideo%2F2008-06-01-the-restoration%3Flang%3Deng"
```

## Usage Examples

### Basic Metadata Retrieval
```javascript
// Get metadata for a specific video
const videoUrl = "https://www.churchofjesuschrist.org/media/video/2018-10-0030-the-restoration-now-you-know?lang=eng";
const metadata = await client.fetchVideoMetadata(videoUrl);

console.log(`Title: ${metadata.title}`);
console.log(`Duration: ${metadata.duration}`);
console.log(`Download URL: ${metadata.videoUrl}`);
```

### Enhanced Video Search
```javascript
// Search for videos with full metadata
const results = await client.searchVideosWithMetadata('restoration');

results.results.forEach(video => {
  console.log(`${video.title} (${video.metadata?.duration})`);
  console.log(`Download: ${video.metadata?.videoUrl}`);
});
```

### Video Playlist Creation
```javascript
// Create a playlist with metadata
async function createVideoPlaylist(searchTerm) {
  const results = await client.searchVideosWithMetadata(searchTerm);
  
  return results.results
    .filter(video => video.metadata) // Only videos with metadata
    .map(video => ({
      title: video.metadata.title,
      description: video.metadata.description,
      duration: video.metadata.duration,
      thumbnail: video.metadata.thumbnail,
      streamUrl: video.metadata.videoUrl,
      pageUrl: video.metadata.embedUrl,
      uploadDate: new Date(video.metadata.uploadDate)
    }));
}
```

### Video Download Manager
```javascript
// Download videos with metadata
class VideoDownloadManager {
  async downloadVideo(videoPageUrl, outputPath) {
    const metadata = await client.fetchVideoMetadata(videoPageUrl);
    
    if (metadata.error) {
      throw new Error(`Failed to get metadata: ${metadata.error.message}`);
    }
    
    // Use metadata.videoUrl for downloading
    return {
      downloadUrl: metadata.videoUrl,
      filename: this.generateFilename(metadata),
      metadata: metadata
    };
  }
  
  generateFilename(metadata) {
    const title = metadata.title.replace(/[^a-zA-Z0-9]/g, '_');
    const duration = metadata.duration.replace(':', 'm') + 's';
    return `${title}_${duration}.mp4`;
  }
}
```

### Video Embedding
```javascript
// Generate embed code with metadata
function generateVideoEmbed(videoPageUrl, metadata) {
  return {
    iframe: `<iframe src="${metadata.embedUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`,
    thumbnail: `<img src="${metadata.thumbnail}" alt="${metadata.title}" />`,
    title: metadata.title,
    description: metadata.description,
    duration: metadata.duration
  };
}
```

## URL Encoding

### Proper URL Encoding
```javascript
// Correct way to encode video URLs
function encodeVideoUrl(videoPageUrl) {
  return encodeURIComponent(videoPageUrl);
}

// Example
const originalUrl = "https://www.churchofjesuschrist.org/media/video/2018-10-0030-the-restoration-now-you-know?lang=eng";
const encodedUrl = encodeVideoUrl(originalUrl);
// Result: "https:%2F%2Fwww.churchofjesuschrist.org%2Fmedia%2Fvideo%2F2018-10-0030-the-restoration-now-you-know%3Flang%3Deng"
```

### Extract Video URLs from Search Results
```javascript
// Extract video URLs from Vertex AI search results
function extractVideoUrls(searchResults) {
  return searchResults.results
    .filter(result => result.link.includes('/media/video/'))
    .map(result => result.link);
}
```

## Performance Considerations

### Batch Metadata Fetching
```javascript
// Fetch metadata for multiple videos with concurrency control
async function fetchBatchMetadata(videoUrls, concurrency = 3) {
  const results = [];
  
  for (let i = 0; i < videoUrls.length; i += concurrency) {
    const batch = videoUrls.slice(i, i + concurrency);
    const batchPromises = batch.map(url => client.fetchVideoMetadata(url));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}
```

### Caching Strategy
```javascript
// Cache video metadata to avoid repeated requests
class VideoMetadataCache {
  constructor(ttl = 3600000) { // 1 hour TTL
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async getMetadata(videoUrl) {
    const cached = this.cache.get(videoUrl);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const metadata = await client.fetchVideoMetadata(videoUrl);
    
    if (!metadata.error) {
      this.cache.set(videoUrl, {
        data: metadata,
        timestamp: Date.now()
      });
    }
    
    return metadata;
  }
}
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| URL encoding | 400 errors | Ensure videoUrl parameter is properly URL-encoded |
| Invalid video URL | Empty or error response | Verify the video URL is from churchofjesuschrist.org/media/video |
| Timeout on bulk requests | Slow response when fetching many | Implement parallel requests with concurrency limit |
| Metadata unavailable | null metadata in response | Some videos may not have complete metadata |

## Video Quality Information

### Download URL Patterns
```javascript
// Video URLs typically follow this pattern:
// https://assets.churchofjesuschrist.org/{hash}-{quality}-{lang}.mp4

// Example qualities:
// - 1080p-en.mp4 (Full HD English)
// - 720p-en.mp4 (HD English)  
// - 480p-en.mp4 (SD English)
// - 1080p-es.mp4 (Full HD Spanish)
```

### Duration Parsing
```javascript
// Parse duration string to seconds
function parseDuration(durationString) {
  const parts = durationString.split(':').map(Number);
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // H:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

// Format seconds to duration string
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
```

## Notes

- This endpoint provides **rich metadata** not available in search results
- The `videoUrl` field in the response provides a **direct MP4 download link**
- Video quality appears to be **1080p** based on the URL pattern
- The endpoint works with video URLs from the **search results**
- Consider **caching metadata** to avoid repeated requests for the same videos
- **Thumbnails** are high-resolution and suitable for display
- **Upload dates** are provided in ISO 8601 format
- **Duration** is in human-readable format (MM:SS or H:MM:SS)
- **Descriptions** provide context and summaries
- Essential for building **video players, download managers, and media libraries**

## Related Documentation

- [Vertex Search](vertex-search.md) - Search for videos using searchType: 'video'
- [General Conference Search](general-conference-search.md) - Many conference talks have associated videos
- [Video content integration examples and best practices](#usage-examples)