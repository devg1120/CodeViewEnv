import { Database } from 'bun:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../backend/data/codebase.db');
const db = new Database(dbPath);

console.log('🧹 Cleaning up database...\n');

// Show current state
const beforeCount = db.prepare('SELECT COUNT(*) as count FROM file_nodes').get();
console.log(`Files before cleanup: ${beforeCount.count}`);

// Delete files that are clearly from node_modules or dependencies
const deleteQuery = db.prepare(`
  DELETE FROM file_nodes 
  WHERE 
    path LIKE '%/node_modules/%' OR
    path LIKE '%/.git/%' OR
    path LIKE '%/dist/%' OR
    path LIKE '%/build/%' OR
    path LIKE '%/.next/%' OR
    path LIKE '%/coverage/%' OR
    relative_path LIKE '%/node_modules/%' OR
    relative_path LIKE '%/.git/%' OR
    relative_path LIKE '%/dist/%' OR
    relative_path LIKE '%/build/%' OR
    relative_path LIKE '%/.next/%' OR
    relative_path LIKE '%/coverage/%'
`);

const deletedCount = deleteQuery.run();
console.log(`Deleted ${deletedCount.changes} dependency/build files`);

// Show remaining files
const afterCount = db.prepare('SELECT COUNT(*) as count FROM file_nodes').get();
console.log(`Files after cleanup: ${afterCount.count}`);

// Update project stats
const projects = db.prepare('SELECT id FROM projects').all();
for (const project of projects) {
  const stats = db.prepare(`
    SELECT COUNT(*) as files_count
    FROM file_nodes 
    WHERE project_id = ? AND type = 'file'
  `).get(project.id);

  db.prepare(`
    UPDATE projects 
    SET files_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(stats.files_count, project.id);
}

console.log('✅ Database cleaned and project stats updated!');

// Show what's left
console.log('\nRemaining file types:');
const fileTypes = db.prepare(`
  SELECT extension, COUNT(*) as count 
  FROM file_nodes 
  WHERE type = 'file' AND extension IS NOT NULL
  GROUP BY extension 
  ORDER BY count DESC 
  LIMIT 15
`).all();

console.table(fileTypes);

db.close();