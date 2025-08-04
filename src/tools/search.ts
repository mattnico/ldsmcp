import { gospelLibraryClient } from "../api/client.js";
import { SearchResult } from "../api/types.js";

interface SearchArgs {
  query: string;
  contentType?: string;
  limit?: number;
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
      },
      required: ["query"],
    },
  },
  handler: async (args: SearchArgs) => {
    const { query, contentType, limit = 10 } = args;
    const results: SearchResult[] = [];
    const searchTerms = query.toLowerCase().split(' ');

    try {
      const searchPatterns = contentType 
        ? COMMON_SEARCH_PATTERNS.filter(p => p.type === contentType)
        : COMMON_SEARCH_PATTERNS;

      for (const patternGroup of searchPatterns) {
        for (const pattern of patternGroup.patterns) {
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
                type: patternGroup.type,
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