#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { fetchContentTool } from "./tools/fetch.js";
import { searchGospelLibraryTool, searchSeminaryTool } from "./tools/search.js";
import { exploreEndpointsTool } from "./tools/explore.js";
import { browseStructureTool } from "./tools/browse.js";
import { fetchMediaTool } from "./tools/media.js";
import { generalConferenceSearchTool } from "./tools/search/general-conference-search.js";
import { vertexSearchTool, comeFollowMeSearchTool, generalHandbookSearchTool } from "./tools/search/vertex-search.js";
import { archiveSearchTool, scriptureArchiveSearchTool, magazineArchiveSearchTool } from "./tools/search/archive-search.js";
import { scriptureSearchTool, bookOfMormonSearchTool, doctrineAndCovenantsSearchTool, bibleSearchTool } from "./tools/search/scripture-search.js";
import { contentResources } from "./resources/content.js";

const server = new Server(
  {
    name: "ldsmcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    console.error("LDS MCP Server: ListToolsRequest received");
    const tools = [
      // Core tools
      fetchContentTool.definition,
      browseStructureTool.definition,
      fetchMediaTool.definition,
      exploreEndpointsTool.definition,
      
      // Smart search (primary)
      searchGospelLibraryTool.definition,
      
      // Specialized search tools
      generalConferenceSearchTool.definition,
      scriptureSearchTool.definition,
      archiveSearchTool.definition,
      searchSeminaryTool.definition,
      
      // Advanced search tools (for power users)
      vertexSearchTool.definition,
      comeFollowMeSearchTool.definition,
      generalHandbookSearchTool.definition,
    ];
    console.error("LDS MCP Server: Returning", tools.length, "tools");
    return { tools };
  } catch (error) {
    console.error("LDS MCP Server: Error in ListToolsRequest:", error);
    throw error;
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: "text",
          text: "Error: No arguments provided",
        },
      ],
    };
  }

  try {
    switch (name) {
      // Core tools
      case "fetch_content":
        return await fetchContentTool.handler(args as any);
      case "browse_structure":
        return await browseStructureTool.handler(args as any);
      case "fetch_media":
        return await fetchMediaTool.handler(args as any);
      case "explore_endpoints":
        return await exploreEndpointsTool.handler(args as any);
      
      // Smart search (primary)
      case "search_gospel_library":
        return await searchGospelLibraryTool.handler(args as any);
      
      // Specialized search tools
      case "search_general_conference":
        return await generalConferenceSearchTool.handler(args as any);
      case "search_scriptures":
        return await scriptureSearchTool.handler(args as any);
      case "search_archive":
        return await archiveSearchTool.handler(args as any);
      case "search_seminary":
        return await searchSeminaryTool.handler(args as any);
      
      // Advanced search tools
      case "search_vertex":
        return await vertexSearchTool.handler(args as any);
      case "search_come_follow_me":
        return await comeFollowMeSearchTool.handler(args as any);
      case "search_general_handbook":
        return await generalHandbookSearchTool.handler(args as any);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: contentResources.list(),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  return await contentResources.read(uri);
});

async function main() {
  try {
    console.error("LDS MCP Server: Starting main function");
    console.error("LDS MCP Server: Server object created:", !!server);
    
    const transport = new StdioServerTransport();
    console.error("LDS MCP Server: Created transport");
    
    // Add process error handlers
    process.on('uncaughtException', (error) => {
      console.error('LDS MCP Server: Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('LDS MCP Server: Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
    console.error("LDS MCP Server: About to connect to transport");
    await server.connect(transport);
    console.error("LDS MCP Server: Connected to transport, server running on stdio");
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.error('LDS MCP Server: Received SIGINT, shutting down gracefully');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.error('LDS MCP Server: Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });
    
  } catch (error) {
    console.error("LDS MCP Server: Error in main function:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("LDS MCP Server: Failed to start server:", error);
  console.error("LDS MCP Server: Error stack:", error?.stack);
  process.exit(1);
});