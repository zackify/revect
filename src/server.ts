import { serve } from "bun";
import express from "express";
import { indexRoute, indexHandler } from "./routes";
import App from "./frontend/public/app.html";
import { search, searchHandler } from "./routes/search";
import { checkForApiKey, checkForApiKeyExpress } from "./shared/checkForApiKey";
import { expressSendAdapter } from "./shared/adapters";

// Create an Express server
const app = express();

// Middleware
app.use(express.json());

// Routes
app.post("/index", checkForApiKeyExpress, async (req, res) => {
  await indexHandler(req.body, expressSendAdapter(res));
});

app.post("/search", checkForApiKeyExpress, async (req, res) => {
  await searchHandler(req.body, expressSendAdapter(res));
});

// Error handler for Express
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error processing request:", err);

  if (err.message.includes("Unexpected end of JSON input")) {
    return res.status(400).json({ error: "Must post data to this endpoint" });
  }
  return res.status(500).json({ error: "Internal Server Error" });
});

// Start the Express server
const PORT = process.env.PORT || 3000;
if (process.env.USE_EXPRESS === "true") {
  app.listen(PORT, () => {
    console.log(`revect.io now running with Express on port ${PORT}`);
  });
} else {
  // Original Bun server for backward compatibility
  serve({
    routes: {
      "/index": checkForApiKey(indexRoute),
      "/search": checkForApiKey(search),
      // frontend
      "/app/*": App,
      "/app": App,
    },
    error(error) {
      console.error("Error processing request:", error);

      if (error.message.includes("Unexpected end of JSON input"))
        return Response.json(
          { error: "Must post data to this endpoint" },
          { status: 400 }
        );
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    },
  });
  console.log("revect.io now running with Bun");
}

// Export the Express app for use in other modules (like MCP)
export default app;
