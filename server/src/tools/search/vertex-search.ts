interface VertexSearchArgs {
  query: string;
  searchType?: 'web' | 'image' | 'video' | 'music' | 'pdf';
  filter?: string;
  start?: number;
  limit?: number;
  orderBy?: string;
  lang?: string;
}

export const vertexSearchTool = {
  definition: {
    name: "search_vertex",
    description: "Multi-type search using Google Vertex AI - supports web, image, video, music, and PDF content",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - use quotes for exact phrases or unquoted for broad search"
        },
        searchType: {
          type: "string",
          description: "Type of content to search for",
          enum: ["web", "image", "video", "music", "pdf"],
          default: "web"
        },
        filter: {
          type: "string",
          description: "Advanced filter expression using siteSearch syntax"
        },
        start: {
          type: "number", 
          description: "Starting index for pagination (1-based, default: 1)",
          minimum: 1,
          default: 1
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
          minimum: 1,
          maximum: 100,
          default: 20
        },
        orderBy: {
          type: "string",
          description: "Sort order for results",
          enum: ["relevance", "date"]
        },
        lang: {
          type: "string",
          description: "Language code (default: eng)",
          default: "eng"
        }
      },
      required: ["query"]
    }
  },
  handler: async (args: VertexSearchArgs) => {
    const { 
      query, 
      searchType = 'web',
      filter,
      start = 1,
      limit = 20,
      orderBy,
      lang = 'eng'
    } = args;

    try {
      // Build query parameters
      const params = new URLSearchParams({
        q: query,
        start: start.toString(),
        searchType: searchType,
        lang: lang
      });

      if (filter) params.append('filter', filter);
      if (orderBy) params.append('orderBy', orderBy);

      const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-search?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'LDS-MCP-Server/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Vertex search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Format results
      let resultText = `# Vertex AI Search Results\n\n`;
      resultText += `**Query:** ${query}\n`;
      resultText += `**Type:** ${searchType}\n`;
      if (filter) resultText += `**Filter:** ${filter}\n`;
      resultText += `**Results:** ${data.searchInformation?.totalResults || data.totalResults || 0} total\n\n`;

      if (!data.items || data.items.length === 0) {
        resultText += `No ${searchType} results found. Try:\n`;
        resultText += `- Different search terms\n`;
        resultText += `- Different content type (web, image, video, music, pdf)\n`;
        resultText += `- Broader or more specific filters\n`;
        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      }

      // Display results with different formatting based on search type
      const displayCount = Math.min(data.items.length, limit);
      resultText += `Showing ${displayCount} results (starting from ${start}):\n\n`;

      data.items.slice(0, limit).forEach((item: any, index: number) => {
        const itemNumber = start + index;
        resultText += `## ${itemNumber}. ${item.title || item.displayTitle || 'Untitled'}\n`;
        
        // Add type-specific information
        switch (searchType) {
          case 'video':
            if (item.duration) resultText += `**Duration:** ${item.duration}\n`;
            if (item.videoUrl) resultText += `**Video URL:** ${item.videoUrl}\n`;
            break;
          case 'music':
            if (item.composer) resultText += `**Composer:** ${item.composer}\n`;
            if (item.audioUrl) resultText += `**Audio URL:** ${item.audioUrl}\n`;
            break;
          case 'image':
            if (item.imageUrl) resultText += `**Image URL:** ${item.imageUrl}\n`;
            if (item.thumbnailUrl) resultText += `**Thumbnail:** ${item.thumbnailUrl}\n`;
            break;
          case 'pdf':
            if (item.pdfUrl) resultText += `**PDF URL:** ${item.pdfUrl}\n`;
            if (item.pageCount) resultText += `**Pages:** ${item.pageCount}\n`;
            break;
        }
        
        if (item.snippet || item.description) {
          resultText += `${item.snippet || item.description}\n`;
        }
        
        resultText += `**Link:** ${item.link || item.url}\n\n`;
      });

      // Add pagination info
      const totalResults = data.searchInformation?.totalResults || data.totalResults || 0;
      if (totalResults > start + displayCount - 1) {
        resultText += `*Use start=${start + displayCount} to see more results*\n`;
      }

      // Add spell check info if available
      if (data.spellCheck?.spellingChanged) {
        resultText += `\n*Search was corrected from "${data.spellCheck.originalQuery}" to "${data.spellCheck.display}"*\n`;
      }

      return {
        content: [{
          type: "text",
          text: resultText
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error in vertex search: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
};

// Specialized vertex search tools for common patterns
export const comeFollowMeSearchTool = {
  definition: {
    name: "search_come_follow_me",
    description: "Search Come, Follow Me study materials with automatic filtering",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for Come, Follow Me content"
        },
        start: {
          type: "number", 
          description: "Starting index for pagination (1-based, default: 1)",
          minimum: 1,
          default: 1
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
          minimum: 1,
          maximum: 50,
          default: 20
        }
      },
      required: ["query"]
    }
  },
  handler: async (args: {query: string, start?: number, limit?: number}) => {
    const filter = 'siteSearch:"churchofjesuschrist.org/study/manual/come-follow-me*"';
    return vertexSearchTool.handler({
      ...args,
      searchType: 'web',
      filter
    });
  }
};

export const generalHandbookSearchTool = {
  definition: {
    name: "search_general_handbook", 
    description: "Search General Handbook policies and procedures",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for General Handbook content"
        },
        start: {
          type: "number",
          description: "Starting index for pagination (1-based, default: 1)", 
          minimum: 1,
          default: 1
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
          minimum: 1,
          maximum: 50,
          default: 20
        }
      },
      required: ["query"]
    }
  },
  handler: async (args: {query: string, start?: number, limit?: number}) => {
    const filter = 'siteSearch:"churchofjesuschrist.org/study/manual/general-handbook*"';
    return vertexSearchTool.handler({
      ...args,
      searchType: 'web',
      filter
    });
  }
};