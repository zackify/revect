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
import { createDocumentsTableSQL } from "../src/database/migrations";

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

// Override the database module before other modules are imported
describe("Document Route", () => {
  let db: Database;
  let documentId: number;
  
  // Create a fresh test setup before tests
  beforeAll(async () => {
    // Create fresh database
    db = new Database(":memory:");
    
    // Configure database
    db.exec("PRAGMA journal_mode = WAL;");
    sqliteVec.load(db);
    db.exec(createDocumentsTableSQL("1536"));
    
    // Spy on database module to return our test db
    mock.module("../src/database/database", () => ({
      db: db,
      getDb: () => db
    }));
  });
  
  // Insert test data before each test
  beforeEach(() => {
    // Clear any existing data
    db.exec("DELETE FROM documents");
    
    // Insert test data
    const sampleText = "This is a test document for document endpoint";
    const sampleSource = "test-source";
    const sampleMetadata = JSON.stringify({ testKey: "testValue" });
    const embeddingsStr = `[${mockEmbeddings.join(",")}]`;
    
    db.query(`
      INSERT INTO documents (text, metadata, embeddings, source)
      VALUES (?, ?, ?, ?)
    `).run(sampleText, sampleMetadata, embeddingsStr, sampleSource);
    
    // Get the document id
    const document = db.query("SELECT id FROM documents LIMIT 1").get() as { id: number } | null;
    documentId = document?.id || 0;
  });
  
  // Clean up after all tests
  afterAll(() => {
    db.close();
  });
  
  test("should retrieve document by id", async () => {
    // Import the module only after our mock is set up
    const { document } = await import("../src/routes/document/document");
    
    // Get document by ID using the handler function directly
    const result = await document({ id: documentId });
    
    // Verify document properties
    expect(result).toHaveProperty("document");
    
    // Type guard to ensure we're checking the success case
    if ("document" in result) {
      const doc = result.document;
      expect(doc).toHaveProperty("id", documentId);
      expect(doc).toHaveProperty("text", "This is a test document for document endpoint");
      expect(doc).toHaveProperty("source", "test-source");
      expect(doc).toHaveProperty("metadata");
      expect(doc.metadata).toHaveProperty("testKey", "testValue");
    } else {
      // This should not happen in this test, but helps TypeScript
      throw new Error("Expected document in result but got error");
    }
  });

  test("should handle non-existent document id", async () => {
    // Import the module only after our mock is set up
    const { document } = await import("../src/routes/document/document");
    
    const result = await document({ id: 9999 });
    
    // Verify error response
    expect(result).toHaveProperty("error", "Document not found");
    expect(result).not.toHaveProperty("document");
  });

  test("should handle validation errors", async () => {
    // Import the module only after our mock is set up
    const { documentRoute } = await import("../src/routes/document/document");
    
    // Create request with missing ID
    const request = new Request("http://localhost/document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    
    // Process the request
    const response = await documentRoute(request);
    const responseData = await response.json();
    
    // Verify validation error
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty("error", "Validation failed");
    expect(responseData).toHaveProperty("issues");
  });
});
