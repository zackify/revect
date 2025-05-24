# revect

open source version

# run

```
docker run \
  -p 3009:3000 \
  -v ~/Documents/revect:/app/data \
  -e AI_BASE_URL="http://host.docker.internal:11434/v1" \
  -e AI_API_KEY="ollama" \
  -e AI_EMBEDDING_MODEL="mxbai-embed-large" \
  -e AI_EMBEDDING_SIZE="1024" \
  -e API_SECRET="test" \
  --add-host=host.docker.internal:host-gateway \
  zachrebuild/revect.io:6
```

# Development

Run with Bun server (default):
```
bun run dev
```

Run with Express server:
```
bun run dev:express
```

# Server Options

The application supports two server options:

1. **Bun Server** (default): Uses Bun's native HTTP server
2. **Express Server**: Uses Express.js for HTTP server functionality

To use Express server, set the environment variable:
```
USE_EXPRESS=true
```

This is useful when integrating with other Express-based applications or when you need middleware that's specific to Express.
