interface ArchiveSearchArgs {
  query: string;
  source?: number;
  author?: string;
  dateRange?: string;
  beginDate?: string;
  endDate?: string;
  sort?: string;
  book?: number;
  page?: number;
  lang?: string;
}

export const archiveSearchTool = {
  definition: {
    name: "search_archive",
    description: "Search across all Gospel Library collections with advanced filtering (scriptures, conference, magazines, media, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - the main search term or phrase"
        },
        source: {
          type: "number",
          description: "Content source ID: 47=General Conference, 48=Scriptures, 46=Magazines, 44=Media, 60=Hymns, 43=Callings, 45=Other"
        },
        author: {
          type: "string",
          description: "Filter by speaker/author slug (e.g., 'russell-m-nelson')"
        },
        dateRange: {
          type: "string",
          description: "Predefined date range or 'custom-date-range'",
          enum: ["any-date", "past-6-months", "past-12-months", "past-5-years", "past-10-years", "2010-2019", "2000-2009", "1990-1999", "1980-1989", "1970-1979", "custom-date-range"]
        },
        beginDate: {
          type: "string",
          description: "Custom start date (YYYY-MM-DD format, requires dateRange='custom-date-range')"
        },
        endDate: {
          type: "string", 
          description: "Custom end date (YYYY-MM-DD format, requires dateRange='custom-date-range')"
        },
        sort: {
          type: "string",
          description: "Sort order: 'book' for scriptures, 'relevance' default",
          enum: ["book", "relevance"]
        },
        book: {
          type: "number",
          description: "Scripture book filter when source=48: 73=Book of Mormon, 74=D&C, 75=New Testament, 76=Old Testament, 77=Pearl of Great Price"
        },
        page: {
          type: "number",
          description: "Page number for pagination (1-based, default: 1)",
          minimum: 1,
          default: 1
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
  handler: async (args: ArchiveSearchArgs) => {
    const {
      query,
      source,
      author,
      dateRange,
      beginDate,
      endDate,
      sort,
      book,
      page = 1,
      lang = 'eng'
    } = args;

    try {
      // Build query parameters
      const params = new URLSearchParams({
        query: query,
        page: page.toString(),
        lang: lang
      });

      // Add optional parameters
      if (source) params.append('source', source.toString());
      if (author) params.append('author', author);
      if (dateRange) params.append('dateRange', dateRange);
      if (beginDate) params.append('beginDate', beginDate);
      if (endDate) params.append('endDate', endDate);
      if (sort) params.append('sort', sort);
      if (book) params.append('book', book.toString());

      const url = `https://www.churchofjesuschrist.org/search/proxy/content-search-service?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'LDS-MCP-Server/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Archive search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Format results
      let resultText = `# Archive Search Results\n\n`;
      resultText += `**Query:** ${query}\n`;
      
      // Add filter info
      if (source) {
        const sourceNames: { [key: number]: string } = {
          47: 'General Conference',
          48: 'Scriptures', 
          46: 'Magazines',
          44: 'Media',
          60: 'Hymns for Home and Church',
          43: 'Callings',
          45: 'Other'
        };
        resultText += `**Source:** ${sourceNames[source] || `ID ${source}`}\n`;
      }
      
      if (author) resultText += `**Author:** ${author}\n`;
      if (dateRange) resultText += `**Date Range:** ${dateRange}\n`;
      if (beginDate && endDate) resultText += `**Custom Dates:** ${beginDate} to ${endDate}\n`;
      if (sort) resultText += `**Sort:** ${sort}\n`;
      
      if (book) {
        const bookNames: { [key: number]: string } = {
          73: 'Book of Mormon',
          74: 'Doctrine and Covenants', 
          75: 'New Testament',
          76: 'Old Testament',
          77: 'Pearl of Great Price'
        };
        resultText += `**Book:** ${bookNames[book] || `ID ${book}`}\n`;
      }
      
      resultText += `**Results:** ${data.searchInformation?.totalResults || 0} total\n`;
      resultText += `**Page:** ${page}\n\n`;

      if (!data.items || data.items.length === 0) {
        resultText += `No results found. Try:\n`;
        resultText += `- Different search terms\n`;
        resultText += `- Different source/collection\n`;
        resultText += `- Broader date range\n`;
        resultText += `- Different author/speaker\n`;
        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      }

      // Display results
      resultText += `Showing ${data.items.length} results:\n\n`;

      data.items.forEach((item: any, index: number) => {
        resultText += `## ${index + 1}. ${item.title}\n`;
        
        if (item.subtitle) {
          resultText += `**Collection:** ${item.subtitle}\n`;
        }
        
        if (item.htmlSnippet) {
          // Clean up HTML snippet
          const cleanSnippet = item.htmlSnippet
            .replace(/<b>/g, '**')
            .replace(/<\/b>/g, '**')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          resultText += `${cleanSnippet}\n`;
        }
        
        resultText += `**Link:** ${item.link}\n\n`;
      });

      // Add pagination info
      const totalResults = data.searchInformation?.totalResults || 0;
      const resultsPerPage = 10; // Default for this endpoint
      const hasMorePages = totalResults > page * resultsPerPage;
      
      if (hasMorePages) {
        resultText += `*Use page=${page + 1} to see more results (${totalResults} total)*\n`;
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
          text: `Error in archive search: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
};

// Convenience tools for specific collections
export const scriptureArchiveSearchTool = {
  definition: {
    name: "search_scriptures_archive",
    description: "Search scriptures with book filtering and book-order sorting",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for scripture content"
        },
        book: {
          type: "number",
          description: "Scripture book: 73=Book of Mormon, 74=D&C, 75=New Testament, 76=Old Testament, 77=Pearl of Great Price"
        },
        sort: {
          type: "string",
          description: "Sort by book order or relevance",
          enum: ["book", "relevance"],
          default: "book"
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
          minimum: 1,
          default: 1
        }
      },
      required: ["query"]
    }
  },
  handler: async (args: {query: string, book?: number, sort?: string, page?: number}) => {
    return archiveSearchTool.handler({
      query: args.query,
      source: 48,
      book: args.book,
      sort: args.sort || 'book',
      page: args.page
    });
  }
};

export const magazineArchiveSearchTool = {
  definition: {
    name: "search_magazines_archive",
    description: "Search Church magazines (Liahona, Friend, For the Strength of Youth, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for magazine content"
        },
        dateRange: {
          type: "string",
          description: "Date range for magazine articles",
          enum: ["any-date", "past-6-months", "past-12-months", "past-5-years", "past-10-years", "2010-2019", "2000-2009", "1990-1999", "1980-1989", "1970-1979"]
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
          minimum: 1,
          default: 1
        }
      },
      required: ["query"]
    }
  },
  handler: async (args: {query: string, dateRange?: string, page?: number}) => {
    return archiveSearchTool.handler({
      query: args.query,
      source: 46,
      dateRange: args.dateRange,
      page: args.page
    });
  }
};