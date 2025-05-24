import { z } from "zod";
import { generate } from "../embed-generation/generate";
import { corsHeaders as headers } from "../shared/corsHeaders";
import { searchDocuments } from "../database/searchDocuments";
import { SendFn } from "../shared/types";

const schema = z.object({
  text: z.string({ required_error: "search text is required" }),
});

// Original function that accepts a Request object
export const search = async (request: Request) => {
  return searchHandler(
    await request.json(),
    (response) => Response.json(response.body, { status: response.status, headers: response.headers || headers })
  );
};

// Abstracted function that accepts a send function
export const searchHandler = async (body: any, send: SendFn) => {
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

  const results = await searchDocuments({ embeddings });

  return send({
    status: 200,
    body: { results },
    headers
  });
};
