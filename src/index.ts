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
import { searchGospelLibraryTool } from "./tools/search.js";
import { exploreEndpointsTool } from "./tools/explore.js";
import { browseStructureTool } from "./tools/browse.js";
import { fetchMediaTool } from "./tools/media.js";
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
  return {
    tools: [
      fetchContentTool.definition,
      searchGospelLibraryTool.definition,
      exploreEndpointsTool.definition,
      browseStructureTool.definition,
      fetchMediaTool.definition,
    ],
  };
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
      case "fetch_content":
        return await fetchContentTool.handler(args as any);
      case "search_gospel_library":
        return await searchGospelLibraryTool.handler(args as any);
      case "explore_endpoints":
        return await exploreEndpointsTool.handler(args as any);
      case "browse_structure":
        return await browseStructureTool.handler(args as any);
      case "fetch_media":
        return await fetchMediaTool.handler(args as any);
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LDS MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});