#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

console.error("LDS MCP Server: Script starting");

const server = new Server(
  {
    name: "ldsmcp-minimal",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

console.error("LDS MCP Server: Server created");

server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("LDS MCP Server: ListToolsRequest received");
  return {
    tools: [
      {
        name: "test_tool",
        description: "A simple test tool",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "A test message"
            }
          }
        }
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error("LDS MCP Server: CallToolRequest received:", request.params.name);
  const { name, arguments: args } = request.params;

  if (name === "test_tool") {
    return {
      content: [
        {
          type: "text",
          text: `Test tool called with: ${JSON.stringify(args)}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

console.error("LDS MCP Server: Request handlers set");

async function main() {
  try {
    console.error("LDS MCP Server: Starting main function");
    
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
    
  } catch (error) {
    console.error("LDS MCP Server: Error in main function:", error);
    throw error;
  }
}

console.error("LDS MCP Server: About to call main()");

main().catch((error) => {
  console.error("LDS MCP Server: Failed to start server:", error);
  console.error("LDS MCP Server: Error stack:", error?.stack);
  process.exit(1);
});

console.error("LDS MCP Server: Script finished setup");