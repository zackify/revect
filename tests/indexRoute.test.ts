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
import { createDocumentsTableSQL, createDocumentChunksTableSQL } from "../src/database/migrations";

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

describe("Index Route", () => {
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
      getDb: () => db
    }));
  });

  beforeEach(() => {
    // Reset mock calls
    generateEmbeddingsMock.mockClear?.();
    
    // Clean up test data
    db.exec("DELETE FROM document_chunks");
    db.exec("DELETE FROM documents");
  });

  afterAll(() => {
    db.close();
  });

  test("should index document and call generateEmbeddings with correct parameters", async () => {
    const sampleText = "This is a test document for indexing";
    const sampleSource = "test-source";
    
    // Import the index route handler
    const { indexRoute } = await import("../src/routes/index/index");
    
    // Create a request with sample data
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: sampleSource,
        text: sampleText,
      }),
    });

    // Process the request
    const response = await indexRoute(request);
    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty("message", "Data successfully indexed");

    // Verify that generateEmbeddings was called with the correct text
    expect(generateEmbeddingsMock.mock.calls.length).toBeGreaterThan(0);
    const callArgs = generateEmbeddingsMock.mock.calls[0];
    if (callArgs) {
      expect(callArgs[0]).toBe(sampleText);
      
      // Verify that the config was passed correctly
      expect(callArgs[1]).toEqual({
        apiKey: "test-key",
        baseURL: process.env.AI_BASE_URL,
      });
    }

    // Check that the document was stored in the database
    const documentCount = db
      .query("SELECT COUNT(*) as count FROM documents")
      .get() as { count: number };
    expect(documentCount.count).toBe(1);

    // Check that the document has the correct source and text
    const document = db
      .query("SELECT source, text FROM documents LIMIT 1")
      .get() as { source: string; text: string };
    expect(document.source).toBe(sampleSource);
    expect(document.text).toBe(sampleText);
  });
});
