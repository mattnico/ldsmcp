interface ScriptureSearchArgs {
  query: string;
  collectionName?: string;
  testament?: string;
  start?: number;
  limit?: number;
  lang?: string;
}

export const scriptureSearchTool = {
  definition: {
    name: "search_scriptures",
    description: "Verse-level search within scriptures with collection filtering",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for scripture verses - use quotes for exact phrases"
        },
        collectionName: {
          type: "string",
          description: "Scripture collection to search within",
          enum: ["The Holy Bible", "The Book of Mormon", "The Doctrine and Covenants", "The Pearl of Great Price"]
        },
        testament: {
          type: "string",
          description: "Testament filter (for Bible searches)",
          enum: ["Old Testament", "New Testament"]
        },
        start: {
          type: "number",
          description: "Starting index for pagination (0-based, default: 0)",
          minimum: 0,
          default: 0
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
          minimum: 1,
          maximum: 100,
          default: 20
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
  handler: async (args: ScriptureSearchArgs) => {
    const {
      query,
      collectionName,
      testament,
      start = 0,
      limit = 20,
      lang = 'eng'
    } = args;

    try {
      // Build query parameters
      const params = new URLSearchParams({
        q: query,
        start: start.toString(),
        lang: lang
      });

      if (collectionName) params.append('collectionName', collectionName);
      if (testament) params.append('testament', testament);

      const url = `https://www.churchofjesuschrist.org/search/proxy/vertex-scripture-search?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'LDS-MCP-Server/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Scripture search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Format results
      let resultText = `# Scripture Search Results\n\n`;
      resultText += `**Query:** ${query}\n`;
      if (collectionName) resultText += `**Collection:** ${collectionName}\n`;
      if (testament) resultText += `**Testament:** ${testament}\n`;
      resultText += `**Results:** ${data.searchInformation?.totalResults || data.totalResults || 0} total\n\n`;

      if (!data.items || data.items.length === 0) {
        resultText += `No scripture verses found. Try:\n`;
        resultText += `- Different search terms\n`;
        resultText += `- Different scripture collection\n`;
        resultText += `- Broader search without quotes\n`;
        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      }

      // Display results 
      const displayCount = Math.min(data.items.length, limit);
      resultText += `Showing ${displayCount} verses (starting from ${start + 1}):\n\n`;

      data.items.slice(0, limit).forEach((item: any, index: number) => {
        const itemNumber = start + index + 1;
        
        // Extract scripture reference and text
        const title = item.title || item.displayTitle || 'Unknown Reference';
        const snippet = item.snippet || item.description || item.text || '';
        
        resultText += `## ${itemNumber}. ${title}\n`;
        
        // Clean up and format the verse text
        const cleanText = snippet
          .replace(/<b>/g, '**')
          .replace(/<\/b>/g, '**')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
          
        if (cleanText) {
          resultText += `${cleanText}\n`;
        }
        
        if (item.link || item.url) {
          resultText += `**Link:** ${item.link || item.url}\n`;
        }
        
        resultText += `\n`;
      });

      // Add pagination info
      const totalResults = data.searchInformation?.totalResults || data.totalResults || 0;
      if (totalResults > start + displayCount) {
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
          text: `Error in scripture search: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
};

// Convenience tools for specific scripture collections
export const bookOfMormonSearchTool = {
  definition: {
    name: "search_book_of_mormon",
    description: "Search specifically within the Book of Mormon",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for Book of Mormon verses"
        },
        start: {
          type: "number",
          description: "Starting index for pagination (0-based, default: 0)",
          minimum: 0,
          default: 0
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
    return scriptureSearchTool.handler({
      ...args,
      collectionName: "The Book of Mormon"
    });
  }
};

export const doctrineAndCovenantsSearchTool = {
  definition: {
    name: "search_doctrine_covenants",
    description: "Search specifically within the Doctrine and Covenants",
    inputSchema: {
      type: "object", 
      properties: {
        query: {
          type: "string",
          description: "Search query for Doctrine and Covenants verses"
        },
        start: {
          type: "number",
          description: "Starting index for pagination (0-based, default: 0)",
          minimum: 0,
          default: 0
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
    return scriptureSearchTool.handler({
      ...args,
      collectionName: "The Doctrine and Covenants"
    });
  }
};

export const bibleSearchTool = {
  definition: {
    name: "search_bible",
    description: "Search within the Holy Bible with testament filtering",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for Bible verses"
        },
        testament: {
          type: "string",
          description: "Testament to search within",
          enum: ["Old Testament", "New Testament"]
        },
        start: {
          type: "number",
          description: "Starting index for pagination (0-based, default: 0)",
          minimum: 0,
          default: 0
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
  handler: async (args: {query: string, testament?: string, start?: number, limit?: number}) => {
    return scriptureSearchTool.handler({
      ...args,
      collectionName: "The Holy Bible"
    });
  }
};