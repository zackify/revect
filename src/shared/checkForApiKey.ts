import type { Request, Response, NextFunction } from "express";
import { corsHeaders } from "./corsHeaders";

export const checkForApiKey = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "OPTIONS") {
    res.set(corsHeaders);
    return res.status(200).end();
  }

  if (req.headers.authorization !== process.env.API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
};
