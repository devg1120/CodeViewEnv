import { Database } from 'bun:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function initDatabase() {
  const dbPath = join(__dirname, '../../data/codebase.db');
  
  // Ensure data directory exists
  const dataDir = dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON');
  
  // Create tables
  createTables(db);
  
  return db;
}

function createTables(db) {
  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      description TEXT,
      language TEXT,
      last_analyzed DATETIME,
      quality_score INTEGER DEFAULT 0,
      lines_of_code INTEGER DEFAULT 0,
      files_count INTEGER DEFAULT 0,
      dependencies_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // File nodes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
      path TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      size INTEGER,
      extension TEXT,
      language TEXT,
      tags TEXT, -- JSON array as string
      last_modified DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `);

  // File analysis table
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_analysis (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      complexity REAL DEFAULT 0,
      maintainability INTEGER DEFAULT 0,
      test_coverage INTEGER DEFAULT 0,
      dependencies TEXT, -- JSON array as string
      issues TEXT, -- JSON array as string
      last_analyzed DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES file_nodes (id) ON DELETE CASCADE
    )
  `);

  // Git info table
  db.exec(`
    CREATE TABLE IF NOT EXISTS git_info (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      branch TEXT,
      last_commit TEXT,
      author TEXT,
      status TEXT CHECK (status IN ('clean', 'modified', 'staged', 'untracked')),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES file_nodes (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_file_nodes_project_id ON file_nodes (project_id);
    CREATE INDEX IF NOT EXISTS idx_file_nodes_path ON file_nodes (path);
    CREATE INDEX IF NOT EXISTS idx_file_nodes_type ON file_nodes (type);
    CREATE INDEX IF NOT EXISTS idx_file_analysis_file_id ON file_analysis (file_id);
    CREATE INDEX IF NOT EXISTS idx_git_info_file_id ON git_info (file_id);
  `);
}