import express from "express";
import routes from "./routes";
import App from "./frontend/public/app.html";
import { corsMiddleware } from "./shared/corsMiddleware";

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(corsMiddleware);

// API Routes
app.use('/', routes);

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
