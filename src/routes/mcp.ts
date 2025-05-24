import { Router, Request, Response } from "express";
import { createMcpServer } from "../../extensions/mcp/server";
import { WebServerTransport } from "@modelcontextprotocol/sdk/server/web.js";

const router = Router();
const mcpServer = createMcpServer();

router.post("/", async (req: Request, res: Response) => {
  // Create a WebServerTransport for this request/response pair
  const transport = new WebServerTransport(req, res);
  
  try {
    // Process the incoming request with the MCP server
    await mcpServer.processHttpRequest(transport);
  } catch (error) {
    console.error("MCP server error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

export default router;