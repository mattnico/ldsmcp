import { Resource } from "@modelcontextprotocol/sdk/types.js";
import { gospelLibraryClient } from "../api/client.js";

interface ContentResource extends Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

const PREDEFINED_RESOURCES: ContentResource[] = [
  {
    uri: "gospel-library://conference/latest",
    name: "Latest General Conference",
    description: "Most recent General Conference talks",
    mimeType: "text/plain",
  },
  {
    uri: "gospel-library://scriptures/bofm",
    name: "Book of Mormon",
    description: "The Book of Mormon: Another Testament of Jesus Christ",
    mimeType: "text/plain",
  },
  {
    uri: "gospel-library://scriptures/dc-testament",
    name: "Doctrine and Covenants",
    description: "Doctrine and Covenants of The Church of Jesus Christ of Latter-day Saints",
    mimeType: "text/plain",
  },
  {
    uri: "gospel-library://manual/come-follow-me",
    name: "Come, Follow Me",
    description: "Come, Follow Me study materials",
    mimeType: "text/plain",
  },
  {
    uri: "gospel-library://navigation/conference-sessions",
    name: "Conference Sessions Navigator",
    description: "Browse General Conference sessions and talks by date",
    mimeType: "text/plain",
  },
  {
    uri: "gospel-library://navigation/scripture-structure",
    name: "Scripture Structure Browser",
    description: "Navigate scripture books, chapters, and sections",
    mimeType: "text/plain",
  },
];

export const contentResources = {
  list: (): Resource[] => {
    return PREDEFINED_RESOURCES.map(({ uri, name, description, mimeType }) => ({
      uri,
      name,
      description,
      mimeType,
    }));
  },

  read: async (uri: string) => {
    const resource = PREDEFINED_RESOURCES.find(r => r.uri === uri);
    
    if (!resource) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Resource not found: ${uri}`,
          },
        ],
      };
    }

    try {
      let apiUri = "";
      let content = "";

      switch (uri) {
        case "gospel-library://conference/latest":
          // Calculate the most recent conference based on current date
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          
          // General Conference happens in April (04) and October (10)
          let year = currentYear;
          let month = currentMonth >= 10 ? "10" : "04";
          
          // If we're before April, use previous year's October conference
          if (currentMonth < 4) {
            year = currentYear - 1;
            month = "10";
          }
          // If we're between April and October, use April
          else if (currentMonth < 10) {
            month = "04";
          }
          
          apiUri = `/general-conference/${year}/${month}`;
          const confResponse = await gospelLibraryClient.fetchContent(apiUri);
          if (!confResponse.error && confResponse.content?.body) {
            const monthName = month === "04" ? "April" : "October";
            content = `# Latest General Conference (${monthName} ${year})\n\n`;
            content += gospelLibraryClient.parseHtmlContent(confResponse.content.body);
          }
          break;

        case "gospel-library://scriptures/bofm":
          apiUri = "/scriptures/bofm";
          const bofmResponse = await gospelLibraryClient.fetchContent(apiUri);
          if (!bofmResponse.error && bofmResponse.content?.body) {
            content = `# Book of Mormon\n\n`;
            content += `Access specific chapters using URIs like:\n`;
            content += `- /scriptures/bofm/1-ne/1 (1 Nephi 1)\n`;
            content += `- /scriptures/bofm/alma/32 (Alma 32)\n`;
            content += `- /scriptures/bofm/moro/10 (Moroni 10)\n\n`;
            const preview = gospelLibraryClient.parseHtmlContent(bofmResponse.content.body);
            content += preview.substring(0, 500) + "...";
          }
          break;

        case "gospel-library://scriptures/dc-testament":
          apiUri = "/scriptures/dc-testament";
          const dcResponse = await gospelLibraryClient.fetchContent(apiUri);
          if (!dcResponse.error && dcResponse.content?.body) {
            content = `# Doctrine and Covenants\n\n`;
            content += `Access specific sections using URIs like:\n`;
            content += `- /scriptures/dc-testament/dc/1 (Section 1)\n`;
            content += `- /scriptures/dc-testament/dc/76 (Section 76)\n`;
            content += `- /scriptures/dc-testament/dc/121 (Section 121)\n\n`;
            const preview = gospelLibraryClient.parseHtmlContent(dcResponse.content.body);
            content += preview.substring(0, 500) + "...";
          }
          break;

        case "gospel-library://manual/come-follow-me":
          apiUri = "/manual/come-follow-me-for-individuals-and-families-book-of-mormon-2024";
          const manualResponse = await gospelLibraryClient.fetchContent(apiUri);
          if (!manualResponse.error && manualResponse.content?.body) {
            content = `# Come, Follow Me\n\n`;
            const preview = gospelLibraryClient.parseHtmlContent(manualResponse.content.body);
            content += preview.substring(0, 1000) + "...";
          }
          break;

        case "gospel-library://navigation/conference-sessions":
          content = `# Conference Sessions Navigator\n\n`;
          content += `Use the \`browse_structure\` tool to navigate General Conference sessions:\n\n`;
          
          // Get current and recent conferences
          const nowConf = new Date();
          const currentYearConf = nowConf.getFullYear();
          const years = [currentYearConf, currentYearConf - 1, currentYearConf - 2];
          
          content += `## Available Conferences\n\n`;
          years.forEach(year => {
            content += `### ${year}\n`;
            content += `- **April ${year}**: \`browse_structure uri="/general-conference/${year}/04"\`\n`;
            content += `- **October ${year}**: \`browse_structure uri="/general-conference/${year}/10"\`\n\n`;
          });
          
          content += `## Example Usage\n`;
          content += `- Browse April 2024 sessions: \`browse_structure uri="/general-conference/2024/04"\`\n`;
          content += `- Find talks by President Nelson: \`search_gospel_library query="Nelson" contentType="general-conference" searchMode="structure"\`\n`;
          break;

        case "gospel-library://navigation/scripture-structure":
          content = `# Scripture Structure Browser\n\n`;
          content += `Navigate scripture books and chapters using the \`browse_structure\` tool:\n\n`;
          
          content += `## Standard Works\n\n`;
          content += `### Book of Mormon\n`;
          content += `- Browse books: \`browse_structure uri="/scriptures/bofm"\`\n`;
          content += `- 1 Nephi chapters: \`browse_structure uri="/scriptures/bofm/1-ne"\`\n`;
          content += `- Alma chapters: \`browse_structure uri="/scriptures/bofm/alma"\`\n\n`;
          
          content += `### Doctrine and Covenants\n`;
          content += `- Browse sections: \`browse_structure uri="/scriptures/dc-testament"\`\n\n`;
          
          content += `### Bible\n`;
          content += `- Old Testament: \`browse_structure uri="/scriptures/ot"\`\n`;
          content += `- New Testament: \`browse_structure uri="/scriptures/nt"\`\n\n`;
          
          content += `### Pearl of Great Price\n`;
          content += `- Browse books: \`browse_structure uri="/scriptures/pgp"\`\n\n`;
          
          content += `## Example Usage\n`;
          content += `- Get Book of Mormon structure: \`browse_structure uri="/scriptures/bofm" depth=2\`\n`;
          content += `- Find chapters about faith: \`search_gospel_library query="faith" contentType="scriptures" searchMode="structure"\`\n`;
          break;
      }

      if (!content) {
        content = `Error loading content for ${resource.name}`;
      }

      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Error reading resource: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
};