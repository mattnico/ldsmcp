# Search API Testing Guide

Comprehensive testing strategies and tools for Gospel Library search API implementations.

## Testing Framework Overview

### Test Categories
1. **Unit Tests** - Individual function and method testing
2. **Integration Tests** - API endpoint verification
3. **Performance Tests** - Response time and load testing
4. **MCP Tests** - Tool behavior and response validation
5. **End-to-End Tests** - Complete workflow verification

### Testing Tools
- **Jest** - JavaScript testing framework
- **Supertest** - HTTP assertion library
- **Artillery** - Load testing
- **MCP Inspector** - Official MCP testing tool
- **Postman/Newman** - API testing and automation

## Unit Testing

### Client Method Testing
```javascript
// Example Jest unit tests for Gospel Library client
describe('GospelLibraryClient', () => {
  let client;
  
  beforeEach(() => {
    client = new GospelLibraryClient();
  });
  
  describe('searchVertexAI', () => {
    it('should format query parameters correctly', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });
      global.fetch = mockFetch;
      
      await client.searchVertexAI('faith', { searchType: 'web', limit: 10 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('searchType=web'),
        expect.any(Object)
      );
    });
    
    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500
      });
      
      const result = await client.searchVertexAI('test');
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('500');
    });
  });
  
  describe('error handling', () => {
    it('should return consistent error format', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await client.searchScriptures('test');
      
      expect(result).toMatchObject({
        error: {
          message: expect.any(String),
          code: 'FETCH_ERROR'
        }
      });
    });
  });
});
```

### Utility Function Testing
```javascript
describe('Response Utilities', () => {
  describe('extractUri', () => {
    it('should extract URI from church URLs', () => {
      const link = 'https://www.churchofjesuschrist.org/study/scriptures/bofm/1-ne/1';
      const uri = extractUri(link);
      expect(uri).toBe('/study/scriptures/bofm/1-ne/1');
    });
    
    it('should handle URLs with query parameters', () => {
      const link = 'https://www.churchofjesuschrist.org/study/general-conference/2024/10/15nelson?lang=eng';
      const uri = extractUri(link);
      expect(uri).toBe('/study/general-conference/2024/10/15nelson');
    });
  });
  
  describe('extractSnippet', () => {
    it('should remove HTML tags from snippets', () => {
      const snippet = 'This is a <b>highlighted</b> snippet with &amp; entities';
      const cleaned = extractSnippet(snippet);
      expect(cleaned).toBe('This is a highlighted snippet with   entities');
    });
  });
});
```

## Integration Testing

### API Endpoint Testing
```javascript
describe('API Integration Tests', () => {
  const client = new GospelLibraryClient();
  
  describe('Vertex AI Search', () => {
    it('should return search results for valid queries', async () => {
      const result = await client.searchVertexAI('faith');
      
      expect(result.error).toBeUndefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });
    
    it('should handle empty search queries', async () => {
      const result = await client.searchVertexAI('');
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_QUERY');
    });
    
    it('should support different search types', async () => {
      const videoResults = await client.searchVertexAI('restoration', { 
        searchType: 'video' 
      });
      
      expect(videoResults.error).toBeUndefined();
      expect(videoResults.results.some(r => r.link.includes('/media/video/'))).toBe(true);
    });
  });
  
  describe('Scripture Search', () => {
    it('should search within specific collections', async () => {
      const result = await client.searchScriptures('faith', {
        collectionName: 'The Book of Mormon'
      });
      
      expect(result.error).toBeUndefined();
      expect(result.results.every(r => 
        r.metadata.collection === 'The Book of Mormon'
      )).toBe(true);
    });
  });
  
  describe('General Conference Search', () => {
    it('should filter by date ranges efficiently', async () => {
      const result = await client.searchGeneralConference('restoration', {
        dateRange: { startYear: 2023, endYear: 2024 }
      });
      
      expect(result.error).toBeUndefined();
      expect(result.results).toBeDefined();
      
      // Verify only April and October months are searched
      const searchFilter = result.requestDetails?.filter;
      expect(searchFilter).toMatch(/\/04\/|\/10\//);
      expect(searchFilter).not.toMatch(/\/01\/|\/02\/|\/03\/|\/05\/|\/06\/|\/07\/|\/08\/|\/09\/|\/11\/|\/12\//);
    });
  });
});
```

### Response Format Validation
```javascript
describe('Response Format Validation', () => {
  const responseSchema = {
    results: 'array',
    pagination: {
      total: 'number',
      limit: 'number',
      offset: 'number'
    }
  };
  
  function validateResponse(response, schema) {
    // Implement schema validation logic
    return true; // Simplified for example
  }
  
  it('should return consistent response format across endpoints', async () => {
    const endpoints = [
      () => client.searchVertexAI('test'),
      () => client.searchScriptures('test'),
      () => client.searchGeneralConference('test')
    ];
    
    for (const endpoint of endpoints) {
      const result = await endpoint();
      if (!result.error) {
        expect(validateResponse(result, responseSchema)).toBe(true);
      }
    }
  });
});
```

## Performance Testing

### Response Time Testing
```javascript
describe('Performance Tests', () => {
  const client = new GospelLibraryClient();
  
  it('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    const result = await client.searchVertexAI('faith');
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(5000); // 5 second timeout
    expect(result.error).toBeUndefined();
  });
  
  it('should handle concurrent requests efficiently', async () => {
    const queries = ['faith', 'hope', 'charity', 'love', 'prayer'];
    const startTime = Date.now();
    
    const results = await Promise.all(
      queries.map(query => client.searchVertexAI(query))
    );
    
    const totalTime = Date.now() - startTime;
    
    // Should complete all 5 searches faster than 5 sequential searches
    expect(totalTime).toBeLessThan(10000);
    expect(results.every(r => !r.error)).toBe(true);
  });
});
```

### Artillery Load Testing
```yaml
# artillery-config.yml
config:
  target: 'https://www.churchofjesuschrist.org'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"
    - duration: 60
      arrivalRate: 20
      name: "Peak load"

scenarios:
  - name: "Search API Load Test"
    requests:
      - get:
          url: "/search/proxy/vertex-search?query=faith&searchType=web&limit=20"
      - get:
          url: "/search/proxy/scripture-search?query=prayer&collectionName=The Book of Mormon"
      - post:
          url: "/search/proxy/general-conference-search"
          json:
            query: "restoration"
            start: 0
            filter: "siteSearch:\"churchofjesuschrist.org/study/general-conference\""
```

## MCP Testing

### MCP Inspector Testing
```bash
# Test MCP tools using the official inspector
npm run inspect

# Test specific tools in the inspector UI:
# 1. search_gospel_library with query="faith" searchMode="vertex"
# 2. fetch_content with uri="/scriptures/bofm/alma/32"
# 3. browse_structure with uri="/general-conference/2024/10" depth=2
```

### MCP Tool Testing
```javascript
describe('MCP Tool Integration', () => {
  const mcpServer = new MCPServer();
  
  beforeEach(async () => {
    await mcpServer.initialize();
  });
  
  it('should handle search_gospel_library tool correctly', async () => {
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_gospel_library",
        arguments: {
          query: "faith",
          searchMode: "vertex",
          limit: 10
        }
      }
    };
    
    const response = await mcpServer.handleRequest(request);
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].type).toBe("text");
    expect(response.result.content[0].text).toContain("Search Results");
  });
  
  it('should handle errors gracefully in MCP tools', async () => {
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_gospel_library",
        arguments: {
          query: "", // Invalid empty query
          searchMode: "vertex"
        }
      }
    };
    
    const response = await mcpServer.handleRequest(request);
    
    expect(response.result.content[0].text).toContain("Error:");
  });
});
```

## Test Data and Fixtures

### Test Queries by Category
```javascript
const testQueries = {
  // High-recall queries (should return many results)
  highRecall: [
    'faith',
    'Jesus Christ',
    'prayer',
    'love',
    'scripture'
  ],
  
  // Specific queries (should return focused results)
  specific: [
    'Russell M. Nelson',
    'Book of Mormon',
    'Alma 32',
    'First Vision',
    'restoration'
  ],
  
  // Multi-word queries
  multiWord: [
    'faith hope charity',
    'plan of salvation',
    'word of wisdom',
    'relief society',
    'family home evening'
  ],
  
  // Edge cases
  edgeCases: [
    '', // Empty query
    'a', // Single character
    'supercalifragilisticexpialidocious', // No results expected
    '!@#$%^&*()', // Special characters
    'faithfaithfaithfaith'.repeat(100) // Very long query
  ]
};
```

### Mock Data for Testing
```javascript
const mockSearchResponse = {
  results: [
    {
      uri: '/scriptures/bofm/alma/32',
      title: 'Alma 32',
      snippet: 'Now, as I said concerning <b>faith</b>—that it was not a perfect knowledge...',
      contentType: 'scripture',
      metadata: {
        collection: 'The Book of Mormon',
        book: 'Alma',
        chapter: '32'
      }
    }
  ],
  pagination: {
    total: 1247,
    limit: 20,
    offset: 0,
    hasMore: true
  }
};

const mockVideoMetadata = {
  title: 'What Is the Restoration?',
  description: 'An explanation of the restoration of the gospel.',
  thumbnail: 'https://assets.churchofjesuschrist.org/image.jpg',
  duration: '5:13',
  videoUrl: 'https://assets.churchofjesuschrist.org/video.mp4',
  embedUrl: 'https://www.churchofjesuschrist.org/media/video/restoration',
  uploadDate: '2025-06-12T01:03:58.13946313Z'
};
```

## Automated Testing Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM UTC

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        API_TIMEOUT: 10000
    
    - name: Run MCP tests
      run: npm run test:mcp
    
    - name: Run performance tests
      run: npm run test:performance
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test-results/
```

### Test Scripts in package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration --runInBand",
    "test:mcp": "jest --testPathPattern=mcp",
    "test:performance": "jest --testPathPattern=performance --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "load-test": "artillery run artillery-config.yml"
  }
}
```

## Test Environment Setup

### Environment Variables
```bash
# .env.test
API_BASE_URL=https://www.churchofjesuschrist.org
API_TIMEOUT=10000
TEST_QUERY_LIMIT=5
ENABLE_INTEGRATION_TESTS=true
ENABLE_PERFORMANCE_TESTS=false
```

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 30000 // 30 seconds for integration tests
};
```

## Continuous Monitoring

### Health Check Tests
```javascript
// Automated health checks for production monitoring
describe('Health Checks', () => {
  const endpoints = [
    'vertex-search',
    'scripture-search', 
    'general-conference-search',
    'getSearchStrings',
    'video-metadata'
  ];
  
  endpoints.forEach(endpoint => {
    it(`${endpoint} should be accessible`, async () => {
      const isHealthy = await checkEndpointHealth(endpoint);
      expect(isHealthy).toBe(true);
    });
  });
});

async function checkEndpointHealth(endpoint) {
  try {
    // Implement basic health check for each endpoint
    const response = await fetch(`https://www.churchofjesuschrist.org/search/proxy/${endpoint}?query=test`);
    return response.status !== 500;
  } catch (error) {
    return false;
  }
}
```

This comprehensive testing guide ensures reliable, performant, and well-validated implementations of Gospel Library search functionality across all development phases.