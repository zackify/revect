import { z } from "zod";
import { generate } from "../embed-generation/generate";
import { corsHeaders as headers } from "../shared/corsHeaders";
import { sql } from "bun";
import { searchDocuments } from "../database/searchDocuments";
import { Request, Response } from "express";

const schema = z.object({
  text: z.string({ required_error: "search text is required" }),
});

export const search = async (req: Request, res: Response) => {
  const body = req.body;
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    return res.status(400).json({
      error: "Validation failed",
      issues: error.issues,
    });
  }

  const embeddings = await generate(data.text, {
    apiKey: process.env.AI_API_KEY as string,
    baseURL: process.env.AI_BASE_URL,
  });

  if (!embeddings) {
    return res.status(500).json({ error: "Failed to generate embeddings" });
  }

  const results = await searchDocuments({ embeddings });

  res.set(headers);
  res.json({
    results,
  });
};
