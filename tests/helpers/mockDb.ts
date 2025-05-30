import Database from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import { createDocumentsTableSQL, createDocumentChunksTableSQL } from "../../src/database/migrations";

/**
 * Creates a fresh in-memory database instance for testing
 * Each test file should create its own instance to avoid connection issues
 */
export function createTestDb() {
  // Create a new in-memory database
  const testDb = new Database(":memory:");
  
  // Enable WAL mode
  testDb.exec("PRAGMA journal_mode = WAL;");
  
  // Load SQLite vector extension
  sqliteVec.load(testDb);
  
  // Run migrations manually (can't use migration functions directly as they use the global db)
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create documents table with 1536 dimensions for OpenAI embeddings
  testDb.exec(createDocumentsTableSQL("1536"));
  
  // Create document chunks table
  testDb.exec(createDocumentChunksTableSQL("1536"));
  
  // Create metadata table
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Insert some initial metadata values that are expected
  testDb.exec(`
    INSERT INTO metadata (key, value) VALUES ('AI_EMBEDDING_MODEL', 'text-embedding-ada-002');
    INSERT INTO metadata (key, value) VALUES ('AI_EMBEDDING_SIZE', '1536');
  `);
  
  return testDb;
}

/**
 * Set up the test database as a global for the duration of test execution
 */
export function setupTestDb() {
  const db = createTestDb();
  (globalThis as any).testDb = db;
  return db;
}

/**
 * Clean up the test database after tests are complete
 */
export function teardownTestDb(db: Database) {
  db.close();
  delete (globalThis as any).testDb;
}