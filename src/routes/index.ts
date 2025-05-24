import { z } from "zod";
import { generate } from "../embed-generation/generate";
import { indexDocument } from "../database/indexDocument";
import { corsHeaders as headers } from "../shared/corsHeaders";
import { SendFn } from "../shared/types";

const schema = z.object({
  source: z.string(),
  external_id: z.string().optional(),
  text: z.string({ required_error: "Text field is required" }),
  metadata: z.record(z.any()).optional(),
});

// Original function that accepts a Request object
export const indexRoute = async (request: Request) => {
  return indexHandler(
    await request.json(),
    (response) => Response.json(response.body, { status: response.status, headers: response.headers || headers })
  );
};

// Abstracted function that accepts a send function
export const indexHandler = async (body: any, send: SendFn) => {
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    return send({
      status: 400,
      body: {
        error: "Validation failed",
        issues: error.issues,
      },
      headers
    });
  }

  if (data?.metadata) {
    const metadataString = JSON.stringify(data.metadata);
    if (new TextEncoder().encode(metadataString).length > 100 * 1024) {
      return send({
        status: 413,
        body: { error: "Metadata exceeds 100KB limit" },
        headers
      });
    }
  }

  //todo later get this from the user table or force ollama if running locally
  const embeddings = await generate(data.text, {
    apiKey: process.env.AI_API_KEY as string,
    baseURL: process.env.AI_BASE_URL,
  });

  if (!embeddings) {
    return send({
      status: 500,
      body: { error: "Failed to generate embeddings" },
      headers
    });
  }

  await indexDocument({ ...data, embeddings });

  return send({
    status: 200,
    body: {
      message: "Data received and validated",
      data,
      embeddings,
    },
    headers
  });
};
