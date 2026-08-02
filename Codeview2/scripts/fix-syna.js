import { Database } from 'bun:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scanRepository } from '../backend/src/services/repositoryScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__dirname);

const dbPath = join(__dirname, '../backend/data/codebase.db');
const db = new Database(dbPath);

console.log('🔧 Fixing Syna project path and rescanning...\n');

// Get Syna project
const syna = db.prepare("SELECT * FROM projects WHERE name = 'Syna'").get();

if (!syna) {
  console.log('❌ Syna project not found!');
  process.exit(1);
}

// Update the path to the correct one
const correctPath = '/home/jon/Projects/syna';
console.log(`📝 Updating path from '${syna.path}' to '${correctPath}'`);

db.prepare(`
  UPDATE projects 
  SET path = ?, updated_at = CURRENT_TIMESTAMP 
  WHERE id = ?
`).run(correctPath, syna.id);

console.log('✅ Path updated!');

// Clear any existing files for this project (there shouldn't be any)
const deleted = db.prepare('DELETE FROM file_nodes WHERE project_id = ?').run(syna.id);
console.log(`🗑️ Cleared ${deleted.changes} existing files`);

// Now rescan with the correct path
console.log('\n🔍 Rescanning Syna project...');
try {
  await scanRepository(db, syna.id, correctPath);
  
  // Check results
  const fileCount = db.prepare('SELECT COUNT(*) as count FROM file_nodes WHERE project_id = ?').get(syna.id);
  console.log(`\n✅ Scan completed! Found ${fileCount.count} files`);
  
  // Show file breakdown
  const fileTypes = db.prepare(`
    SELECT extension, COUNT(*) as count 
    FROM file_nodes 
    WHERE project_id = ? AND type = 'file' AND extension IS NOT NULL
    GROUP BY extension 
    ORDER BY count DESC 
    LIMIT 10
  `).all(syna.id);
  
  console.log('\n📊 File types found:');
  console.table(fileTypes);
  
  // Show project stats
  const updatedProject = db.prepare("SELECT name, files_count, lines_of_code FROM projects WHERE id = ?").get(syna.id);
  console.log('\n📈 Updated project stats:');
  console.table(updatedProject);
  
} catch (error) {
  console.error('❌ Scan failed:', error);
}

db.close();