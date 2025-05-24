import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
export const createMcpServer = () => {
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
        //TODO make dynamic
        const response = await fetch(`${process.env.API_URL}/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            //TODO make dynamic
            Authorization: process.env.API_SECRET as string,
          },
          body: JSON.stringify({ text }),
        });
        const { results } = (await response.json()) as { results: any[] };

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
        //TODO make dynamic
        const response = await fetch(`${process.env.API_URL}/index`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            //TODO make dynamic
            Authorization: process.env.API_SECRET as string,
          },
          body: JSON.stringify({ text, source: "mcp" }),
        });
        const { message } = (await response.json()) as { message: string };

        return {
          content: [
            {
              type: "text",
              text: message,
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

  return server;
};

// When this file is directly executed (not imported)
if (require.main === module) {
  // Start receiving messages on stdin and sending messages on stdout
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch(console.error);
}
