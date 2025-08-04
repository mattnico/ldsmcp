import { gospelLibraryClient } from "../api/client.js";
import { SearchResult } from "../api/types.js";

interface SearchArgs {
  query: string;
  contentType?: string;
  limit?: number;
  searchMode?: 'content' | 'structure' | 'both';
}

const COMMON_SEARCH_PATTERNS = [
  { type: "scriptures", patterns: ["/scriptures/bofm", "/scriptures/dc-testament", "/scriptures/pgp", "/scriptures/ot", "/scriptures/nt"] },
  { type: "general-conference", patterns: ["/general-conference/2025", "/general-conference/2024", "/general-conference/2023"] },
  { type: "manuals", patterns: ["/manual", "/study/manual"] },
  { type: "magazines", patterns: ["/liahona", "/ensign", "/friend"] },
];

export const searchGospelLibraryTool = {
  definition: {
    name: "search_gospel_library",
    description: "Search for content in the LDS Gospel Library",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query terms",
        },
        contentType: {
          type: "string",
          description: "Filter by content type (scriptures, general-conference, manuals, magazines)",
          enum: ["scriptures", "general-conference", "manuals", "magazines"],
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
          default: 10,
        },
        searchMode: {
          type: "string",
          description: "Search mode: 'content' for text search, 'structure' for metadata search, 'both' for combined (default: 'both')",
          enum: ["content", "structure", "both"],
          default: "both",
        },
      },
      required: ["query"],
    },
  },
  handler: async (args: SearchArgs) => {
    const { query, contentType, limit = 10, searchMode = 'both' } = args;
    const results: SearchResult[] = [];
    const searchTerms = query.toLowerCase().split(' ');

    try {
      const searchPatterns = contentType 
        ? COMMON_SEARCH_PATTERNS.filter(p => p.type === contentType)
        : COMMON_SEARCH_PATTERNS;

      // Search using dynamic endpoints for structure/metadata
      if (searchMode === 'structure' || searchMode === 'both') {
        for (const patternGroup of searchPatterns) {
          for (const pattern of patternGroup.patterns) {
            const dynamicResponse = await gospelLibraryClient.fetchDynamic(pattern);
            
            if (!dynamicResponse.error && dynamicResponse.content) {
              const structureResults = gospelLibraryClient.parseDynamicContent(dynamicResponse);
              
              for (const item of structureResults) {
                const titleMatches = searchTerms.some((term: string) => 
                  item.title.toLowerCase().includes(term)
                );
                const descriptionMatches = item.description && searchTerms.some((term: string) => 
                  item.description!.toLowerCase().includes(term)
                );
                const speakerMatches = item.metadata?.speaker && searchTerms.some((term: string) => 
                  item.metadata!.speaker!.toLowerCase().includes(term)
                );
                
                if (titleMatches || descriptionMatches || speakerMatches) {
                  results.push({
                    title: item.title,
                    uri: item.uri,
                    snippet: item.description || `${item.type} in ${patternGroup.type}`,
                    type: `${patternGroup.type}-${item.type}`,
                  });
                  
                  if (results.length >= limit) {
                    break;
                  }
                }
              }
            }
            
            if (results.length >= limit) {
              break;
            }
          }
          
          if (results.length >= limit) {
            break;
          }
        }
      }

      // Search using content endpoints for text content (if not enough results from structure search)
      if ((searchMode === 'content' || searchMode === 'both') && results.length < limit) {
        const remainingLimit = limit - results.length;
        
        for (const patternGroup of searchPatterns) {
          for (const pattern of patternGroup.patterns) {
            // Skip if we already found this URI in structure search
            if (results.some(r => r.uri === pattern)) continue;
            
            const response = await gospelLibraryClient.fetchContent(pattern);
            
            if (!response.error && response.content?.body) {
              const plainText = gospelLibraryClient.parseHtmlContent(response.content.body);
              const lowerText = plainText.toLowerCase();
              
              const matchesQuery = searchTerms.every((term: string) => lowerText.includes(term));
              
              if (matchesQuery) {
                const matchIndex = lowerText.indexOf(searchTerms[0]);
                const snippetStart = Math.max(0, matchIndex - 100);
                const snippetEnd = Math.min(plainText.length, matchIndex + 200);
                const snippet = plainText.substring(snippetStart, snippetEnd);
                
                results.push({
                  title: response.meta?.title || 'Untitled',
                  uri: pattern,
                  snippet: snippet,
                  type: `${patternGroup.type}-content`,
                });

                if (results.length >= limit) {
                  break;
                }
              }
            }
          }
          
          if (results.length >= limit) {
            break;
          }
        }
      }

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No results found for "${query}". Note: This is a basic search implementation. For more comprehensive results, try using more specific URIs with the fetch_content tool.`,
            },
          ],
        };
      }

      let resultText = `# Search Results for "${query}"\n\n`;
      resultText += `Found ${results.length} result(s):\n\n`;

      results.forEach((result, index) => {
        resultText += `## ${index + 1}. ${result.title}\n`;
        resultText += `**Type:** ${result.type}\n`;
        resultText += `**URI:** ${result.uri}\n`;
        resultText += `**Snippet:** ...${result.snippet}...\n\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
};