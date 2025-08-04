# Endpoint Documentation Template

Use this template for documenting new search endpoints. Follow this structure for consistency across all endpoint documentation.

## Template Structure

### 📋 Endpoint Name: `[ENDPOINT_PATH]`

Brief description of what the endpoint does and its primary use case.

#### **Basic Information**
- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/[ENDPOINT_PATH]`
- **HTTP Method:** `GET` | `POST`
- **Content-Type:** `application/json` (if POST) | N/A (if GET)
- **Authentication:** None required | API Key | Session
- **Rate Limiting:** [Known limits or "Unknown"]
- **Purpose:** [Brief description of endpoint purpose]

#### **Parameters**

##### Required Parameters
```typescript
interface RequiredParams {
  query: string;           // Search query text
  lang?: string;          // Language code (default: "eng")
  // Add other required params here
}
```

##### Optional Parameters
```typescript
interface OptionalParams {
  limit?: number;         // Results per page (default: 20, max: 100)
  offset?: number;        // Pagination offset (default: 0)
  contentType?: string;   // Filter by content type
  // Add other optional params here
}
```

##### Parameter Examples
```javascript
// Basic search
{ query: "faith", lang: "eng" }

// Advanced search with filters
{ 
  query: "prayer", 
  lang: "eng", 
  limit: 50, 
  contentType: "general-conference",
  year: 2024 
}
```

#### **Response Format**

##### Success Response Structure
```typescript
interface SearchResponse {
  results: SearchResult[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  facets?: {
    contentTypes: { [key: string]: number };
    speakers?: { [key: string]: number };
    years?: { [key: string]: number };
  };
}

interface SearchResult {
  uri: string;
  title: string;
  snippet: string;
  contentType: string;
  relevanceScore?: number;
  metadata: {
    speaker?: string;
    date?: string;
    publication?: string;
    // Additional metadata fields
  };
}
```

##### Error Response Structure
```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}
```

##### Response Examples

**Successful Search Response:**
```json
{
  "results": [
    {
      "uri": "/general-conference/2024/10/15nelson",
      "title": "Think Celestial",
      "snippet": "...faith in Jesus Christ enables us to...",
      "contentType": "general-conference",
      "relevanceScore": 0.95,
      "metadata": {
        "speaker": "Russell M. Nelson",
        "date": "2024-10-01",
        "publication": "General Conference"
      }
    }
  ],
  "pagination": {
    "total": 1247,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "facets": {
    "contentTypes": {
      "general-conference": 156,
      "scripture": 891,
      "manual": 200
    }
  }
}
```

**Error Response:**
```json
{
  "error": {
    "message": "Invalid query parameter",
    "code": "INVALID_QUERY",
    "details": {
      "parameter": "limit",
      "issue": "exceeds maximum value of 100"
    }
  }
}
```

#### **Code Integration**

##### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async searchContent(query, options = {}) {
  const params = new URLSearchParams({
    query: query,
    lang: options.lang || this.defaultLang,
    limit: options.limit || 20,
    offset: options.offset || 0,
    ...options.filters
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/[ENDPOINT_PATH]?${params}`;
  
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
```

##### MCP Tool Integration
```javascript
// MCP tool handler
async function handleSearchEndpoint(args, messageId) {
  const { query, contentType, limit = 20, offset = 0 } = args;
  
  try {
    const searchResponse = await gospelLibraryClient.searchContent(query, {
      filters: { contentType },
      limit,
      offset
    });
    
    if (searchResponse.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Search error: ${searchResponse.error.message}`
          }]
        }
      });
      return;
    }

    // Format results for MCP response
    let resultText = `# Search Results for "${query}"\\n\\n`;
    resultText += `Found ${searchResponse.pagination.total} total results:\\n\\n`;

    searchResponse.results.forEach((result, index) => {
      resultText += `## ${index + 1}. ${result.title}\\n`;
      resultText += `**Type:** ${result.contentType}\\n`;
      resultText += `**URI:** ${result.uri}\\n`;
      if (result.metadata.speaker) {
        resultText += `**Speaker:** ${result.metadata.speaker}\\n`;
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

// Tool definition
{
  name: "search_endpoint",
  description: "Search [description of what this endpoint searches]",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query text"
      },
      contentType: {
        type: "string",
        description: "Content type filter",
        enum: ["type1", "type2", "type3"]
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 20)",
        default: 20
      },
      offset: {
        type: "number",
        description: "Starting offset for pagination (default: 0)",
        default: 0
      }
    },
    required: ["query"]
  }
}
```

##### Error Handling Pattern
```javascript
// Standard error handling for all search endpoints
function handleSearchError(error, fallbackAction) {
  console.error('Search API error:', error);
  
  // Always provide fallback functionality
  if (typeof fallbackAction === 'function') {
    return fallbackAction();
  }
  
  return {
    error: {
      message: 'Search temporarily unavailable, please try again',
      code: 'SEARCH_UNAVAILABLE'
    }
  };
}
```

#### **Testing Information**

##### Test Cases
```javascript
// Test queries that should return results
const testCases = [
  {
    query: "faith",
    expectedMinResults: 100,
    description: "Basic single-word search"
  },
  {
    query: "faith hope charity",
    expectedMinResults: 50,
    description: "Multi-word search"
  },
  {
    query: "Russell M. Nelson",
    filters: { contentType: "general-conference" },
    expectedMinResults: 20,
    description: "Speaker-specific search"
  }
];
```

##### cURL Testing Commands
```bash
# Basic search test
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/[ENDPOINT_PATH]?query=faith&lang=eng&limit=5"

# Advanced search test (if POST)
curl -X POST "https://www.churchofjesuschrist.org/search/proxy/[ENDPOINT_PATH]" \
  -H "Content-Type: application/json" \
  -d '{"query":"prayer","contentType":"scripture","limit":10}'
```

##### Expected Results
- **Response Time:** < 2 seconds for typical queries
- **Result Quality:** Relevant content with accurate snippets
- **Pagination:** Consistent total counts across pages
- **Facets:** Accurate content type counts

#### **Common Issues & Workarounds**

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Rate limiting | 429 errors | Implement exponential backoff |
| Empty results | No results for valid queries | Check query encoding and parameters |
| Timeout errors | Request hangs | Set reasonable timeout (10-15 seconds) |
| [Specific Issue] | [Symptoms] | [Workaround] |

#### **Notes**
- [Key implementation notes]
- [Performance considerations]
- [Special features or limitations]
- [Integration recommendations]

#### **Related Documentation**
- [Link to related endpoints]
- [Integration examples]
- [Best practices]

---

## Template Guidelines

### When Documenting New Endpoints

1. **Replace all placeholders** in square brackets `[PLACEHOLDER]`
2. **Test thoroughly** before documenting - include real examples
3. **Follow TypeScript interfaces** for consistency
4. **Include complete code examples** that actually work
5. **Document edge cases** and error conditions
6. **Provide cURL commands** for easy testing
7. **Link to related documentation**

### Required Sections

- ✅ Basic Information (URL, method, auth, purpose)
- ✅ Parameters (required, optional, examples)
- ✅ Response Format (success, error, examples)
- ✅ Code Integration (JavaScript, MCP, error handling)
- ✅ Testing Information (test cases, cURL, expected results)
- ✅ Common Issues & Workarounds (troubleshooting table)
- ✅ Notes (implementation details, limitations)

### Optional Sections

- Advanced Usage Examples
- Performance Considerations  
- Multi-language Support
- Caching Strategies
- Security Considerations

### Code Examples Standards

- **Always include working code** - test before documenting
- **Use consistent naming** - follow existing patterns
- **Include error handling** - never ignore errors
- **Provide complete examples** - not just snippets
- **Comment complex logic** - explain non-obvious parts

### Testing Standards

- **Include multiple test cases** - basic, advanced, edge cases
- **Provide cURL commands** - for easy manual testing
- **Document expected results** - what success looks like
- **Include failure scenarios** - what can go wrong

This template ensures consistent, comprehensive documentation across all search endpoints while providing practical, working examples for rapid implementation.