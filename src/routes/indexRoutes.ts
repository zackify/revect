import { z } from "zod";
import { generate } from "../embed-generation/generate";
import { indexDocument } from "../database/indexDocument";
import { Request, Response } from "express";

const schema = z.object({
  source: z.string(),
  external_id: z.string().optional(),
  text: z.string({ required_error: "Text field is required" }),
  metadata: z.record(z.any()).optional(),
});

export const indexRoute = async (req: Request, res: Response) => {
  const body = req.body;
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    return res.status(400).json({
      error: "Validation failed",
      issues: error.issues,
    });
  }

  if (data?.metadata) {
    const metadataString = JSON.stringify(data.metadata);
    if (new TextEncoder().encode(metadataString).length > 100 * 1024) {
      return res.status(413).json({ error: "Metadata exceeds 100KB limit" });
    }
  }

  //todo later get this from the user table or force ollama if running locally
  const embeddings = await generate(data.text, {
    apiKey: process.env.AI_API_KEY as string,
    baseURL: process.env.AI_BASE_URL,
  });

  if (!embeddings) {
    return res.status(500).json({ error: "Failed to generate embeddings" });
  }

  await indexDocument({ ...data, embeddings });

  res.json({
    message: "Data received and validated",
    data,
    embeddings,
  });
};