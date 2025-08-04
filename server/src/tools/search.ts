import { SearchIntelligence } from "./search/search-intelligence.js";
import { generalConferenceSearchTool } from "./search/general-conference-search.js";
import { vertexSearchTool, comeFollowMeSearchTool, generalHandbookSearchTool } from "./search/vertex-search.js";
import { archiveSearchTool, scriptureArchiveSearchTool, magazineArchiveSearchTool } from "./search/archive-search.js";
import { scriptureSearchTool, bookOfMormonSearchTool, doctrineAndCovenantsSearchTool, bibleSearchTool } from "./search/scripture-search.js";
import { SeminarySearch } from "./search/seminary-search.js";
import { gospelLibraryClient } from "../api/client.js";

interface SmartSearchArgs {
  query: string;
  searchMode?: 'smart' | 'comprehensive' | 'specific';
  forceEndpoint?: string;
  contentHint?: 'conference' | 'scripture' | 'manual' | 'magazine' | 'media';
  limit?: number;
}

export const searchGospelLibraryTool = {
  definition: {
    name: "search_gospel_library",
    description: "Intelligent search across all Gospel Library content with automatic endpoint selection and smart routing",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - use quotes for exact phrases or unquoted for broad search"
        },
        searchMode: {
          type: "string",
          description: "Search strategy: 'smart' uses AI routing (default), 'comprehensive' searches multiple endpoints, 'specific' requires forceEndpoint",
          enum: ["smart", "comprehensive", "specific"],
          default: "smart"
        },
        forceEndpoint: {
          type: "string",
          description: "Force a specific search endpoint (use with searchMode='specific')",
          enum: ["conference", "scriptures", "archive", "vertex", "come-follow-me", "handbook", "seminary"]
        },
        contentHint: {
          type: "string",
          description: "Hint about expected content type to improve search routing",
          enum: ["conference", "scripture", "manual", "magazine", "media"]
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 20)",
          minimum: 1,
          maximum: 100,
          default: 20
        }
      },
      required: ["query"]
    }
  },
  handler: async (args: SmartSearchArgs) => {
    const { query, searchMode = 'smart', forceEndpoint, contentHint, limit = 20 } = args;

    try {
      // Analyze the query for intelligent routing
      const analysis = SearchIntelligence.analyzeQuery(query);
      const intent = SearchIntelligence.determineSearchIntent(query, { contentHint });

      let resultText = `# Smart Gospel Library Search\n\n`;
      resultText += `**Query:** ${query}\n`;
      resultText += `**Search Mode:** ${searchMode}\n`;
      resultText += `**Detected Content Type:** ${analysis.contentType}\n`;
      resultText += `**AI Routing:** ${intent.primaryEndpoint} (${Math.round(intent.confidence * 100)}% confidence)\n`;
      resultText += `**Reasoning:** ${intent.reasoning}\n\n`;

      let searchResults: any;

      if (searchMode === 'specific' && forceEndpoint) {
        // Use forced endpoint
        searchResults = await executeSpecificSearch(forceEndpoint, query, intent.suggestedParams, limit);
        resultText += `**Forced Endpoint:** ${forceEndpoint}\n\n`;
      } else if (searchMode === 'comprehensive') {
        // Search multiple endpoints and combine results
        searchResults = await executeComprehensiveSearch(query, intent, limit);
        resultText += `**Comprehensive Search:** Multiple endpoints\n\n`;
      } else {
        // Smart routing (default)
        searchResults = await executeSmartSearch(intent, limit);
      }

      // Check if we got results
      if (!searchResults || !searchResults.content || !searchResults.content[0]) {
        // Try fallback endpoints
        resultText += `## Primary search returned no results, trying fallback...\n\n`;
        
        for (const fallbackEndpoint of intent.fallbackEndpoints) {
          try {
            // Use smarter fallback parameters based on endpoint type
            let fallbackParams: any = {query};
            if (fallbackEndpoint === 'search_archive' && analysis.contentType === 'conference') {
              fallbackParams = {
                query,
                source: 47, // General Conference
                dateRange: 'past-12-months'
              };
            }
            
            searchResults = await executeSpecificSearch(fallbackEndpoint, query, fallbackParams, limit);
            if (searchResults && searchResults.content && searchResults.content[0] && 
                !searchResults.content[0].text.includes('No results found')) {
              resultText += `**Fallback Success:** ${fallbackEndpoint}\n\n`;
              break;
            }
          } catch (error) {
            console.error(`Fallback ${fallbackEndpoint} failed:`, error);
          }
        }
      }

      // If still no results, provide suggestions
      if (!searchResults || !searchResults.content || 
          searchResults.content[0]?.text?.includes('No results found')) {
        resultText += `## No Results Found\n\n`;
        resultText += `**Search Suggestions:**\n`;
        const suggestions = SearchIntelligence.getSearchSuggestions(query, analysis);
        suggestions.forEach(suggestion => {
          resultText += `- ${suggestion}\n`;
        });
        resultText += `\n**Try these alternative searches:**\n`;
        resultText += `- Use searchMode="comprehensive" for broader search\n`;
        resultText += `- Try different keywords or phrases\n`;
        resultText += `- Use specific tools like search_general_conference or search_scriptures\n`;
        
        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      }

      // Combine our header with the search results
      const originalText = searchResults.content[0].text;
      const combinedText = resultText + originalText;

      return {
        content: [{
          type: "text",
          text: combinedText
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error in smart search: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
};

// Helper functions for smart search execution
async function executeSmartSearch(intent: any, limit: number) {
  return await executeSpecificSearch(intent.primaryEndpoint, intent.suggestedParams.query, intent.suggestedParams, limit);
}

async function executeSpecificSearch(endpoint: string, query: string, params: any, limit: number) {
  const searchParams = { query, ...params, limit };
  
  switch (endpoint) {
    case 'search_general_conference':
      return await generalConferenceSearchTool.handler(searchParams);
    case 'search_scriptures':
      return await scriptureSearchTool.handler(searchParams);
    case 'search_archive':
      return await archiveSearchTool.handler(searchParams);
    case 'search_vertex':
      return await vertexSearchTool.handler(searchParams);
    case 'search_come_follow_me':
      return await comeFollowMeSearchTool.handler({ query, limit });
    case 'search_general_handbook':
      return await generalHandbookSearchTool.handler({ query, limit });
    case 'search_seminary':
      return await executeSeminarySearch(searchParams);
    case 'search_scriptures_archive':
      return await scriptureArchiveSearchTool.handler(searchParams);
    case 'search_magazines_archive':
      return await magazineArchiveSearchTool.handler(searchParams);
    default:
      return await archiveSearchTool.handler({ query });
  }
}

// Seminary search execution helper
async function executeSeminarySearch(params: any) {
  try {
    const seminarySearch = new SeminarySearch(gospelLibraryClient);
    
    const result = await seminarySearch.searchSeminary({
      query: params.query,
      lessonNumber: params.lessonNumber,
      subject: params.subject,
      start: 1,
      limit: params.limit || 20
    });
    
    if (result.error) {
      return {
        content: [{
          type: "text",
          text: `# Seminary Manual Search\n\n**Error:** ${result.error.message}\n\nTry using broader search terms or check if the lesson number exists.`
        }]
      };
    }
    
    if (result.results.length === 0) {
      return {
        content: [{
          type: "text",
          text: `# Seminary Manual Search\n\n**Query:** ${params.query}\n\nNo seminary manual content found for this query.\n\n**Suggestions:**\n- Try searching without quotes for broader results\n- Include terms like "seminary", "lesson", or specific subjects\n- Try lesson numbers like "lesson 107" or "lesson 25"`
        }]
      };
    }
    
    let resultText = `# Seminary Manual Search Results\n\n`;
    resultText += `**Query:** ${params.query}\n`;
    if (params.lessonNumber) resultText += `**Lesson Number:** ${params.lessonNumber}\n`;
    if (params.subject) resultText += `**Subject:** ${params.subject.replace('-', ' ')}\n`;
    resultText += `**Found:** ${result.results.length} results\n\n`;
    
    result.results.forEach((item, index) => {
      resultText += `## ${index + 1}. ${item.title}\n\n`;
      if (item.metadata.lessonNumber) {
        resultText += `**Lesson:** ${item.metadata.lessonNumber} | `;
      }
      if (item.metadata.subject) {
        resultText += `**Subject:** ${item.metadata.subject.replace('-', ' ')} | `;
      }
      if (item.metadata.manualType) {
        resultText += `**Type:** ${item.metadata.manualType} manual | `;
      }
      resultText += `**Manual:** ${item.metadata.manual}\n`;
      resultText += `**URI:** ${item.uri}\n`;
      resultText += `**Link:** ${item.link}\n\n`;
      resultText += `${item.snippet}\n\n`;
      resultText += `---\n\n`;
    });
    
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
        text: `# Seminary Manual Search Error\n\n${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function executeComprehensiveSearch(query: string, intent: any, limit: number) {
  const searchLimit = Math.max(5, Math.floor(limit / 3)); // Divide limit among endpoints
  const results: any[] = [];
  
  try {
    // Try primary endpoint
    const primaryResult = await executeSpecificSearch(intent.primaryEndpoint, query, intent.suggestedParams, searchLimit);
    if (primaryResult?.content?.[0] && !primaryResult.content[0].text.includes('No results found')) {
      results.push({
        endpoint: intent.primaryEndpoint,
        result: primaryResult,
        confidence: intent.confidence
      });
    }
    
    // Try fallback endpoints
    for (const fallbackEndpoint of intent.fallbackEndpoints.slice(0, 2)) {
      try {
        const fallbackResult = await executeSpecificSearch(fallbackEndpoint, query, { query }, searchLimit);
        if (fallbackResult?.content?.[0] && !fallbackResult.content[0].text.includes('No results found')) {
          results.push({
            endpoint: fallbackEndpoint,
            result: fallbackResult,
            confidence: 0.5
          });
        }
      } catch (error) {
        console.error(`Comprehensive search - ${fallbackEndpoint} failed:`, error);
      }
    }
    
    if (results.length === 0) {
      return {
        content: [{
          type: "text",
          text: `# Comprehensive Search Results\n\nNo results found across multiple endpoints.\n\nTried: ${intent.primaryEndpoint}, ${intent.fallbackEndpoints.join(', ')}`
        }]
      };
    }
    
    // Combine results with confidence scores
    let combinedText = `# Comprehensive Search Results\n\n`;
    combinedText += `**Query:** ${query}\n`;
    combinedText += `**Endpoints Searched:** ${results.length}\n\n`;
    
    results.forEach((result, index) => {
      const confidence = Math.round(result.confidence * 100);
      combinedText += `## Results from ${result.endpoint} (${confidence}% confidence)\n\n`;
      // Extract just the results part, skip the header
      const resultText = result.result.content[0].text;
      const resultsSection = resultText.split('\n\n').slice(1).join('\n\n');
      combinedText += resultsSection + '\n\n---\n\n';
    });
    
    return {
      content: [{
        type: "text",
        text: combinedText
      }]
    };
    
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error in comprehensive search: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

// Dedicated Seminary Search Tool
export const searchSeminaryTool = {
  definition: {
    name: "search_seminary",
    description: "Search seminary and institute manuals for lesson plans, teaching materials, and curriculum resources",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - include terms like 'lesson 107', 'seminary manual', or specific topics"
        },
        lessonNumber: {
          type: "number",
          description: "Specific lesson number (e.g., 107 for Lesson 107)",
          minimum: 1,
          maximum: 200
        },
        subject: {
          type: "string",
          description: "Seminary subject/curriculum",
          enum: ["old-testament", "new-testament", "book-of-mormon", "doctrine-and-covenants"]
        },
        manualType: {
          type: "string",
          description: "Type of manual to search",
          enum: ["teacher", "student", "both"],
          default: "both"
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
  handler: async (args: any) => {
    return await executeSeminarySearch(args);
  }
};