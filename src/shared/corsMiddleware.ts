import { Request, Response, NextFunction } from "express";
import { corsHeaders } from "./corsHeaders";

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Apply CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
};