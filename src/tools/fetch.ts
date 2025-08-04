import { gospelLibraryClient } from "../api/client.js";

interface FetchContentArgs {
  uri: string;
  lang?: string;
  includeHtml?: boolean;
}

export const fetchContentTool = {
  definition: {
    name: "fetch_content",
    description: "Fetch content from the LDS Gospel Library by URI",
    inputSchema: {
      type: "object",
      properties: {
        uri: {
          type: "string",
          description: "The URI of the content (e.g., '/scriptures/bofm/1-ne/1', '/general-conference/2025/04/13holland')",
        },
        lang: {
          type: "string",
          description: "Language code (default: 'eng')",
          default: "eng",
        },
        includeHtml: {
          type: "boolean",
          description: "Include raw HTML in response (default: false)",
          default: false,
        },
      },
      required: ["uri"],
    },
  },
  handler: async (args: FetchContentArgs) => {
    const { uri, lang, includeHtml } = args;
    
    const response = await gospelLibraryClient.fetchContent(uri, lang);
    
    if (response.error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching content: ${response.error.message}`,
          },
        ],
      };
    }

    let result = `# ${response.meta?.title || 'Gospel Library Content'}\n\n`;
    
    if (response.meta) {
      result += `**Type:** ${response.meta.contentType || 'Unknown'}\n`;
      if (response.meta.publication) {
        result += `**Publication:** ${response.meta.publication}\n`;
      }
      if (response.meta.publicationDate) {
        result += `**Date:** ${response.meta.publicationDate}\n`;
      }
      if (response.meta.audioUrl) {
        result += `**Audio:** ${response.meta.audioUrl}\n`;
      }
      if (response.meta.videoUrl) {
        result += `**Video:** ${response.meta.videoUrl}\n`;
      }
      result += '\n---\n\n';
    }

    if (response.content?.body) {
      if (includeHtml) {
        result += `## Content (HTML)\n\n${response.content.body}\n\n`;
      } else {
        const plainText = gospelLibraryClient.parseHtmlContent(response.content.body);
        result += `## Content\n\n${plainText}\n\n`;
      }
    }

    if (response.content?.footnotes && response.content.footnotes.length > 0) {
      result += `## Footnotes\n\n`;
      response.content.footnotes.forEach((note) => {
        result += `**${note.noteMarker}** ${note.noteContent}\n`;
        if (note.noteRefs) {
          note.noteRefs.forEach((ref) => {
            result += `  - [${ref.text}](${ref.href})\n`;
          });
        }
      });
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
};