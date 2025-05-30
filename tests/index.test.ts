import {
  expect,
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  mock,
  spyOn,
} from "bun:test";
import Database from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import {
  createDocumentsTableSQL,
  createDocumentChunksTableSQL,
} from "../src/database/migrations";
import { indexRoute } from "../src/routes/index/index";

// Set test environment variables
process.env.DATABASE_PATH = ":memory:"; // In-memory database for tests
process.env.AI_API_KEY = "test-key";
process.env.AI_EMBEDDING_MODEL = "test-model";

// Mock for generateEmbeddings
const mockEmbeddings = Array(1536).fill(0.1);
const generateEmbeddingsMock = mock(async (text, config) => {
  return mockEmbeddings;
});

// Mock the generateEmbeddings module
mock.module("../src/shared/generateEmbeddings", () => {
  return {
    generateEmbeddings: generateEmbeddingsMock,
  };
});

describe("Index and Search routes", () => {
  let db: Database;

  beforeAll(async () => {
    // Create fresh database
    db = new Database(":memory:");

    // Configure database
    db.exec("PRAGMA journal_mode = WAL;");
    sqliteVec.load(db);
    db.exec(createDocumentsTableSQL("1536"));
    db.exec(createDocumentChunksTableSQL("1536"));

    // Spy on database module to return our test db
    mock.module("../src/database/database", () => ({
      db: db,
      getDb: () => db,
    }));
  });

  beforeEach(async () => {
    // Clean up test data
    db.exec("DELETE FROM document_chunks");
    db.exec("DELETE FROM documents");
  });

  afterAll(() => {
    db.close();
  });

  test("should store short text as a single document with one chunk", async () => {
    // Create a request for indexing
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test-source",
        text: "This is a short test document.",
      }),
    });

    // Process the index request
    const response = await indexRoute(request);
    expect(response.status).toBe(200);

    // Check that one document was stored
    const docCount = db
      .query("SELECT COUNT(*) as count FROM documents")
      .get() as { count: number };
    expect(docCount.count).toBe(1);

    // For short text, we should have just one chunk
    const chunkCount = db
      .query("SELECT COUNT(*) as count FROM document_chunks")
      .get() as { count: number };
    expect(chunkCount.count).toBe(1);
  });

  test("should store long text as a document with multiple chunks", async () => {
    // Import the module
    const { indexRoute } = await import("../src/routes/index/index");

    // Create a long text that will be split into multiple chunks
    const longText = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia, nunc eu tincidunt lobortis, 
      orci massa accumsan lectus, vel varius metus neque ut enim. Donec ullamcorper risus id enim faucibus, 
      non vestibulum ligula dapibus. Aenean eget erat. Phasellus sed leo quis metus sollicitudin consequat. 
      Sed imperdiet eros at diam cursus, sed volutpat nibh accumsan. Integer vel tincidunt nisl, id interdum nisi. 
      Nulla facilisi. Cras eu dolor a neque lacinia tincidunt vel vitae mi. Pellentesque habitant morbi tristique.
      Senectus et netus et malesuada fames ac turpis egestas. Curabitur at nunc sed risus pellentesque vestibulum. 
      Fusce eget metus quis magna mollis rhoncus. Pellentesque habitant morbi tristique senectus et netus et 
      malesuada fames ac turpis egestas. Proin at semper libero. Nullam non sollicitudin risus.
    `;

    // Create a request for indexing
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test-source",
        text: longText,
      }),
    });

    // Process the index request
    const response = await indexRoute(request);
    expect(response.status).toBe(200);

    // Check that one document was stored
    const docCount = db
      .query("SELECT COUNT(*) as count FROM documents")
      .get() as { count: number };
    expect(docCount.count).toBe(1);

    // For long text, we should have multiple chunks
    const chunkCount = db
      .query("SELECT COUNT(*) as count FROM document_chunks")
      .get() as { count: number };
    expect(chunkCount.count).toBeGreaterThan(1);
  });

  test("should be able to search for indexed documents", async () => {
    // Import modules
    const { indexRoute } = await import("../src/routes/index/index");
    const { searchRoute } = await import("../src/routes/search/search");

    // First, index a document
    const text =
      "Here is some text about artificial intelligence and machine learning";

    // Create a request for indexing
    const indexRequest = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test-source",
        text: text,
      }),
    });

    // Process the index request
    await indexRoute(indexRequest);

    // Now search for it
    const searchRequest = new Request("http://localhost/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "artificial intelligence",
      }),
    });

    // Process the search request
    const searchResponse = await searchRoute(searchRequest);
    const searchData = await searchResponse.json();

    // Verify search results
    expect(searchResponse.status).toBe(200);
    expect(searchData.results).toBeDefined();

    // Since our mock always returns the same embeddings, any search will match
    expect(searchData.results.length).toBeGreaterThan(0);

    // Check the first result
    if (searchData.results.length > 0) {
      const result = searchData.results[0];
      expect(result.text).toBeDefined();
      expect(result.source).toBe("test-source");
    }
  });

  test("should require source parameter when indexing documents", async () => {
    // Create a request without a source parameter
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // No source provided
        text: "This is a short test document.",
      }),
    });

    // Process the request
    const response = await indexRoute(request);
    const responseData = await response.json();

    // Verify we get an error response
    expect(response.status).toBe(400);
    expect(responseData.error).toBeDefined();
  });

  test("should correctly set timestamps when indexing documents", async () => {
    // Create a request
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test",
        text: "This is a short test document.",
      }),
    });

    // Process the request
    await indexRoute(request);

    // Check if document has a timestamp
    const document = db
      .query("SELECT created_at FROM documents ORDER BY id DESC LIMIT 1")
      .get() as { created_at: string };

    expect(document).toBeDefined();
    expect(document.created_at).toBeDefined();
    expect(new Date(document.created_at).getTime()).not.toBeNaN(); // Valid date

    // Check if document chunk has a timestamp
    const chunk = db
      .query("SELECT created_at FROM document_chunks ORDER BY id DESC LIMIT 1")
      .get() as { created_at: string };

    expect(chunk).toBeDefined();
    expect(chunk.created_at).toBeDefined();
    expect(new Date(chunk.created_at).getTime()).not.toBeNaN(); // Valid date
  });
});
