import { serve, type BunRequest } from "bun";
import { indexRoute } from "./routes";
import App from "./frontend/public/app.html";
import { corsHeaders } from "./shared/corsHeaders";

const checkForApiKey =
  (fn: (request: BunRequest) => Promise<Response>) => (request: BunRequest) => {
    if (request.method === "OPTIONS")
      return new Response(null, { headers: corsHeaders });

    if (request.headers.get("Authorization") !== process.env.API_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return fn(request);
  };

serve({
  routes: {
    "/index": checkForApiKey(indexRoute),
    "/app/*": App,
    "/app": App,
    "/db/:year/:month": (request) => {
      return new Response(
        Bun.file(`./data/${request.params.year}/${request.params.month}.db`)
      );
    },
    "/db/:year/:month/wal": (request) => {
      return new Response(
        Bun.file(`./data/${request.params.year}/${request.params.month}.db.wal`)
      );
    },
  },
  error(error) {
    console.error("Error processing request:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  },
});
console.log("revect.io now running");
