import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import app from "../../src/server"; // Import the Express app
import { indexHandler } from "../../src/routes";
import { searchHandler } from "../../src/routes/search";
import { expressSendAdapter } from "../../src/shared/adapters";

// Create an MCP server
const server = new McpServer({
  name: "revect",
  version: "1.0.0",
});

// Search the index tool
server.tool(
  "semantic-search",
  "Search your database for any information, and list the results in order",
  { text: z.string() },
  async ({ text }) => {
    try {
      // Using the handler directly instead of making a fetch request
      const results: any[] = [];
      
      await searchHandler({ text }, ({ body }) => {
        if (body.results) {
          results.push(...body.results);
        }
      });

      return {
        content: [
          {
            type: "text",
            text: `Here are the results for ${text}. Please mention the 'id' and 'source' when telling the user about them.`,
          },
          ...(results
            .map((result: any) => [
              {
                type: "text",
                text: `id:${result.id}, source:${result.source}\n\n${result.text}`,
              },
            ])
            .flatMap((x) => x) as { type: "text"; text: string }[]),
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to search: ${(e as Error).message}`,
          },
        ],
      };
    }
  }
);

// index more content
server.tool(
  "archive-or-index-message",
  "Archive / index / store / persist the last messages to the user's database",
  { text: z.string() },
  async ({ text }) => {
    try {
      // Using the handler directly instead of making a fetch request
      let message = "";
      
      await indexHandler({ text, source: "mcp" }, ({ body }) => {
        if (body.message) {
          message = body.message;
        }
      });

      return {
        content: [
          {
            type: "text",
            text: message || "Successfully indexed content",
          },
        ],
      };
    } catch (e) {
      console.error(e);
      return {
        content: [
          {
            type: "text",
            text: `Failed to index: ${(e as Error).message}`,
          },
        ],
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
