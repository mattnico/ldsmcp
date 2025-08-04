import { gospelLibraryClient } from "../../api/client.js";

interface GeneralConferenceSearchArgs {
  query: string;
  startYear?: number;
  endYear?: number;
  speaker?: string;
  orderBy?: string;
  start?: number;
  limit?: number;
}

export const generalConferenceSearchTool = {
  definition: {
    name: "search_general_conference",
    description: "Search General Conference talks with optimized date filtering and speaker options",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - use quotes for exact phrases (e.g., '\"plan of salvation\"') or unquoted for broad search"
        },
        startYear: {
          type: "number",
          description: "Start year for date range (default: current year - 10)",
          minimum: 1971
        },
        endYear: {
          type: "number", 
          description: "End year for date range (default: current year)",
          minimum: 1971
        },
        speaker: {
          type: "string",
          description: "Filter by speaker name (e.g., 'Russell M. Nelson')"
        },
        orderBy: {
          type: "string",
          description: "Sort order for results",
          enum: ["relevance", "date"]
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
        }
      },
      required: ["query"]
    }
  },
  handler: async (args: GeneralConferenceSearchArgs) => {
    const { 
      query, 
      startYear = new Date().getFullYear() - 10,
      endYear = new Date().getFullYear(),
      speaker,
      orderBy = "",
      start = 0,
      limit = 20
    } = args;

    try {
      // Build date filter - only April (04) and October (10) since those are General Conference months
      const datePaths: string[] = [];
      for (let year = startYear; year <= endYear; year++) {
        datePaths.push(`siteSearch:"churchofjesuschrist.org/study/general-conference/${year}/04/"`);
        datePaths.push(`siteSearch:"churchofjesuschrist.org/study/general-conference/${year}/10/"`);
      }
      
      // Build filter string
      let filter = `(${datePaths.join(' OR ')})`;
      filter += ` AND (siteSearch:"*lang=eng*" OR -siteSearch:"*lang=*")`;
      filter += ` AND -siteSearch:"*imageView=*"`;
      filter += ` AND -siteSearch:"*adbid=*"`;
      filter += ` AND -siteSearch:"*adbpl=*"`;
      filter += ` AND -siteSearch:"*adbpr=*"`;
      filter += ` AND -siteSearch:"*cid=*"`;
      filter += ` AND -siteSearch:"*short_code=*"`;

      // Add speaker filter if provided
      if (speaker) {
        const speakerSlug = speaker.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '');
        filter += ` AND siteSearch:"*/${speakerSlug}"`;
      }

      const payload = {
        query: query,
        start: start,
        filter: filter,
        orderBy: orderBy,
        sort: ""
      };

      const response = await fetch('https://www.churchofjesuschrist.org/search/proxy/general-conference-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LDS-MCP-Server/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Format results
      let resultText = `# General Conference Search Results\n\n`;
      resultText += `**Query:** ${query}\n`;
      resultText += `**Date Range:** ${startYear} - ${endYear}\n`;
      if (speaker) resultText += `**Speaker:** ${speaker}\n`;
      resultText += `**Results:** ${data.searchInformation?.totalResults || 0} total\n\n`;

      if (!data.items || data.items.length === 0) {
        resultText += `No results found. Try:\n`;
        resultText += `- Broader search terms (remove quotes for fuzzy search)\n`;
        resultText += `- Different date range\n`;
        resultText += `- Different speaker name\n`;
        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      }

      // Display results with pagination info
      const displayCount = Math.min(data.items.length, limit);
      resultText += `Showing ${displayCount} results (starting from ${start + 1}):\n\n`;

      data.items.slice(0, limit).forEach((item: any, index: number) => {
        resultText += `## ${start + index + 1}. ${item.title}\n`;
        if (item.snippet) {
          resultText += `${item.snippet}\n`;
        }
        resultText += `**Link:** ${item.link}\n\n`;
      });

      // Add pagination info
      const totalResults = data.searchInformation?.totalResults || 0;
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
          text: `Error searching General Conference: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
};