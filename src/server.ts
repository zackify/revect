import express from "express";
import { indexRoute } from "./routes";
import App from "./frontend/public/app.html";
import { search } from "./routes/search";
import { checkForApiKey } from "./shared/checkForApiKey";
import mcpRouter from "./routes/mcp";

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Apply CORS headers for all responses
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.set({
      "Access-Control-Allow-Origin": "app://obsidian.md",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization"
    });
    return res.status(200).end();
  }
  next();
});

// Routes
app.post("/index", checkForApiKey, indexRoute);
app.post("/search", checkForApiKey, search);
app.use("/mcp", mcpRouter);

// Frontend routes
app.get("/app/*", (_, res) => {
  res.send(App);
});
app.get("/app", (_, res) => {
  res.send(App);
});

// Error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error processing request:", err);

  if (err.message.includes("Unexpected end of JSON input")) {
    return res.status(400).json({ error: "Must post data to this endpoint" });
  }
  return res.status(500).json({ error: "Internal Server Error" });
});

// Start server
app.listen(port, () => {
  console.log(`revect.io now running on port ${port}`);
});
