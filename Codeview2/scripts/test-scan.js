import { Database } from 'bun:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scanRepository } from '../backend/src/services/repositoryScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../backend/data/codebase.db');
const db = new Database(dbPath);

console.log('🧪 Testing repository scanner...\n');

// Get CodeViewer project
const project = db.prepare(`SELECT * FROM projects WHERE name = 'CodeViewer'`).get();

if (!project) {
  console.log('❌ CodeViewer project not found!');
  process.exit(1);
}

console.log(`📁 Project: ${project.name}`);
console.log(`📂 Path: ${project.path}`);

// Clear existing files for this project
console.log('\n🗑️ Clearing existing files...');
const deleted = db.prepare('DELETE FROM file_nodes WHERE project_id = ?').run(project.id);
console.log(`Deleted ${deleted.changes} existing files`);

// Rescan the repository
console.log('\n🔍 Rescanning repository...');
try {
  await scanRepository(db, project.id, project.path);
  
  // Check results
  const fileCount = db.prepare('SELECT COUNT(*) as count FROM file_nodes WHERE project_id = ?').get(project.id);
  console.log(`\n✅ Scan completed! Found ${fileCount.count} files`);
  
  // Show file breakdown
  const fileTypes = db.prepare(`
    SELECT extension, COUNT(*) as count 
    FROM file_nodes 
    WHERE project_id = ? AND type = 'file' AND extension IS NOT NULL
    GROUP BY extension 
    ORDER BY count DESC 
    LIMIT 10
  `).all(project.id);
  
  console.log('\n📊 File types found:');
  console.table(fileTypes);
  
  // Show some sample documentable files
  const docFiles = db.prepare(`
    SELECT name, relative_path, extension 
    FROM file_nodes 
    WHERE project_id = ? 
    AND (
      extension = 'md' OR
      relative_path LIKE '%/routes/%' OR
      relative_path LIKE '%/components/%'
    )
    LIMIT 10
  `).all(project.id);
  
  console.log('\n📚 Sample documentable files:');
  console.table(docFiles);
  
} catch (error) {
  console.error('❌ Scan failed:', error);
}

db.close();