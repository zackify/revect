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

# API Documentation

The API documentation is available as an OpenAPI specification in the [openapi.json](./openapi.json) file at the root of this repository. It describes the available endpoints, request/response formats, and authentication requirements.
