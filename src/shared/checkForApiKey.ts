import type { BunRequest } from "bun";
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import { corsHeaders } from "./corsHeaders";

// Bun middleware
export const checkForApiKey = (
  fn: (request: BunRequest) => Promise<Response>
) => (request: BunRequest) => {
  if (request.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  if (request.headers.get("Authorization") !== process.env.API_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return fn(request);
};

// Express middleware
export const checkForApiKeyExpress = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => {
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== process.env.API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};
