import { gospelLibraryClient } from "../api/client.js";
import { StructureBrowseResult } from "../api/types.js";

interface BrowseStructureArgs {
  uri: string;
  lang?: string;
  depth?: number;
}

export const browseStructureTool = {
  definition: {
    name: "browse_structure",
    description: "Browse the hierarchical structure of Gospel Library content using dynamic endpoints",
    inputSchema: {
      type: "object",
      properties: {
        uri: {
          type: "string",
          description: "The URI to browse (e.g., '/general-conference/2024/10', '/scriptures/bofm')",
        },
        lang: {
          type: "string",
          description: "Language code (default: 'eng')",
          default: "eng",
        },
        depth: {
          type: "number",
          description: "How deep to browse nested structures (default: 1, max: 3)",
          default: 1,
          minimum: 1,
          maximum: 3,
        },
      },
      required: ["uri"],
    },
  },
  handler: async (args: BrowseStructureArgs) => {
    const { uri, lang, depth = 1 } = args;
    
    const response = await gospelLibraryClient.fetchDynamic(uri, lang);
    
    if (response.error) {
      return {
        content: [
          {
            type: "text",
            text: `Error browsing structure: ${response.error.message}`,
          },
        ],
      };
    }

    const results = gospelLibraryClient.parseDynamicContent(response);
    
    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No structural content found for "${uri}". This may be a leaf node or the content may not be available via the dynamic endpoint.`,
          },
        ],
      };
    }

    // If depth > 1, fetch child structures
    if (depth > 1) {
      for (const result of results) {
        if (result.type === 'collection' || result.type === 'book') {
          try {
            const childResponse = await gospelLibraryClient.fetchDynamic(result.uri, lang);
            if (!childResponse.error) {
              const childResults = gospelLibraryClient.parseDynamicContent(childResponse);
              result.children = childResults.slice(0, 10); // Limit to prevent overwhelming output
            }
          } catch (error) {
            // Continue without children if fetch fails
          }
        }
      }
    }

    let resultText = `# Structure Browser: ${uri}\n\n`;
    resultText += `Found ${results.length} items:\n\n`;

    results.forEach((result, index) => {
      resultText += formatStructureItem(result, 0, index + 1);
    });

    if (results.length > 0 && results.some(r => r.type === 'collection' || r.type === 'book')) {
      resultText += `\n## Usage Tips\n`;
      resultText += `- Use \`fetch_content\` to get the actual text content of specific items\n`;
      resultText += `- Use \`browse_structure\` with higher depth to explore nested structures\n`;
      resultText += `- Collections and books can be browsed deeper for their contents\n`;
    }

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  },
};

function formatStructureItem(item: StructureBrowseResult, indent: number = 0, number?: number): string {
  const prefix = '  '.repeat(indent) + (number ? `${number}. ` : '- ');
  const typeIcon = getTypeIcon(item.type);
  
  let result = `${prefix}${typeIcon} **${item.title}**\n`;
  
  if (item.description) {
    result += `${'  '.repeat(indent + 1)}_${item.description}_\n`;
  }
  
  if (item.metadata?.speaker) {
    result += `${'  '.repeat(indent + 1)}👤 ${item.metadata.speaker}\n`;
  }
  
  if (item.metadata?.date || item.metadata?.timeframe) {
    const dateInfo = item.metadata.date || item.metadata.timeframe;
    result += `${'  '.repeat(indent + 1)}📅 ${dateInfo}\n`;
  }
  
  result += `${'  '.repeat(indent + 1)}🔗 \`${item.uri}\`\n`;
  
  if (item.children && item.children.length > 0) {
    result += `${'  '.repeat(indent + 1)}**Children:**\n`;
    item.children.forEach((child, idx) => {
      result += formatStructureItem(child, indent + 2, idx + 1);
    });
  }
  
  result += '\n';
  return result;
}

function getTypeIcon(type: StructureBrowseResult['type']): string {
  switch (type) {
    case 'collection': return '📚';
    case 'book': return '📖';
    case 'chapter': return '📄';
    case 'section': return '📝';
    case 'session': return '🎤';
    default: return '📋';
  }
}