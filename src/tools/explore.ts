import { gospelLibraryClient } from "../api/client.js";
import { ExploreResult } from "../api/types.js";

interface ExploreArgs {
  baseUri?: string;
  patterns?: string[];
  depth?: number;
}

const DEFAULT_EXPLORE_PATTERNS = [
  "/scriptures",
  "/scriptures/bofm",
  "/scriptures/dc-testament", 
  "/scriptures/pgp",
  "/scriptures/ot",
  "/scriptures/nt",
  "/general-conference",
  "/general-conference/2025",
  "/general-conference/2024",
  "/manual",
  "/study/manual",
  "/liahona",
  "/ensign",
  "/friend",
  "/media-library",
  "/music",
  "/history",
  "/teachings",
];

export const exploreEndpointsTool = {
  definition: {
    name: "explore_endpoints",
    description: "Explore and discover available endpoints in the Gospel Library API",
    inputSchema: {
      type: "object",
      properties: {
        baseUri: {
          type: "string",
          description: "Base URI to start exploration from",
        },
        patterns: {
          type: "array",
          items: { type: "string" },
          description: "Custom URI patterns to test",
        },
        depth: {
          type: "number",
          description: "How deep to explore subdirectories (default: 1)",
          default: 1,
        },
      },
    },
  },
  handler: async (args: ExploreArgs) => {
    const { baseUri, patterns, depth = 1 } = args;
    const results: ExploreResult[] = [];
    
    const urisToTest = patterns || (baseUri ? [`${baseUri}`] : DEFAULT_EXPLORE_PATTERNS);

    try {
      for (const uri of urisToTest) {
        const response = await gospelLibraryClient.fetchContent(uri);
        
        if (!response.error && response.content) {
          results.push({
            uri,
            title: response.meta?.title,
            type: response.meta?.contentType,
            success: true,
          });

          if (depth > 1 && response.content.body) {
            const linkMatches = response.content.body.match(/href="\/study\/([^"]+)"/g);
            if (linkMatches) {
              const subUris = linkMatches
                .map(match => match.replace('href="/study', '').replace('"', ''))
                .filter((subUri, index, self) => self.indexOf(subUri) === index)
                .slice(0, 5);

              for (const subUri of subUris) {
                const subResponse = await gospelLibraryClient.fetchContent(subUri);
                if (!subResponse.error) {
                  results.push({
                    uri: subUri,
                    title: subResponse.meta?.title,
                    type: subResponse.meta?.contentType,
                    success: true,
                  });
                }
              }
            }
          }
        } else {
          results.push({
            uri,
            success: false,
            error: response.error?.message || "Unknown error",
          });
        }
      }

      let resultText = `# Gospel Library API Exploration Results\n\n`;
      resultText += `Tested ${results.length} endpoints:\n\n`;

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        resultText += `## ✅ Successful Endpoints (${successful.length})\n\n`;
        successful.forEach(result => {
          resultText += `- **${result.uri}**\n`;
          if (result.title) resultText += `  - Title: ${result.title}\n`;
          if (result.type) resultText += `  - Type: ${result.type}\n`;
        });
        resultText += '\n';
      }

      if (failed.length > 0) {
        resultText += `## ❌ Failed Endpoints (${failed.length})\n\n`;
        failed.forEach(result => {
          resultText += `- **${result.uri}**: ${result.error}\n`;
        });
      }

      resultText += `\n## Suggested Next Steps\n\n`;
      resultText += `1. Use \`fetch_content\` with any successful URI to get full content\n`;
      resultText += `2. Explore deeper paths by adding to the successful URIs\n`;
      resultText += `3. Common patterns: /year/month/speaker for conference talks\n`;

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
            text: `Error exploring endpoints: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
};