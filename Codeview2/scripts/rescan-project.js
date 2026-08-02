import { Database } from 'bun:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { scanRepository } from '../backend/src/services/repositoryScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../backend/data/codebase.db');
const db = new Database(dbPath);

// Get project name and optional new path from command line
const projectName = process.argv[2];
const newPath = process.argv[3];

if (!projectName) {
  console.log('Usage: bun run scripts/rescan-project.js <project-name> [new-path]');
  console.log('\nAvailable projects:');
  const projects = db.prepare('SELECT name, path FROM projects ORDER BY name').all();
  projects.forEach(p => console.log(`  - ${p.name} (${p.path})`));
  process.exit(1);
}

console.log(`🔄 Rescanning project: ${projectName}\n`);

// Get project details
const project = db.prepare("SELECT * FROM projects WHERE name = ?").get(projectName);

if (!project) {
  console.log(`❌ Project '${projectName}' not found!`);
  process.exit(1);
}

let scanPath = project.path;

// Update path if provided
if (newPath) {
  console.log(`📝 Updating path from '${project.path}' to '${newPath}'`);
  
  if (!existsSync(newPath)) {
    console.log(`❌ New path does not exist: ${newPath}`);
    process.exit(1);
  }
  
  db.prepare(`
    UPDATE projects 
    SET path = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(newPath, project.id);
  
  scanPath = newPath;
  console.log('✅ Path updated!');
}

// Verify path exists
if (!existsSync(scanPath)) {
  console.log(`❌ Path does not exist: ${scanPath}`);
  console.log('Use: bun run scripts/debug-project.js <project-name> to find the correct path');
  process.exit(1);
}

// Clear existing files
console.log('🗑️ Clearing existing files...');
const deleted = db.prepare('DELETE FROM file_nodes WHERE project_id = ?').run(project.id);
console.log(`Cleared ${deleted.changes} files`);

// Reset project stats
db.prepare(`
  UPDATE projects 
  SET files_count = 0, lines_of_code = 0, last_analyzed = NULL, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`).run(project.id);

// Rescan the project
console.log(`\n🔍 Scanning: ${scanPath}`);
try {
  await scanRepository(db, project.id, scanPath);
  
  // Get updated stats
  const updatedProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(project.id);
  
  console.log('\n✅ Scan completed!');
  console.table({
    'Project': updatedProject.name,
    'Files': updatedProject.files_count,
    'Lines of Code': updatedProject.lines_of_code,
    'Last Analyzed': updatedProject.last_analyzed
  });
  
  // Show file breakdown
  const fileTypes = db.prepare(`
    SELECT extension, COUNT(*) as count 
    FROM file_nodes 
    WHERE project_id = ? AND type = 'file' AND extension IS NOT NULL
    GROUP BY extension 
    ORDER BY count DESC 
    LIMIT 10
  `).all(project.id);
  
  if (fileTypes.length > 0) {
    console.log('\n📊 File types found:');
    console.table(fileTypes);
  }
  
  // Show documentable files
  const docFiles = db.prepare(`
    SELECT name, relative_path 
    FROM file_nodes 
    WHERE project_id = ? 
    AND (extension = 'md' OR relative_path LIKE '%/components/%' OR relative_path LIKE '%/routes/%')
    LIMIT 5
  `).all(project.id);
  
  if (docFiles.length > 0) {
    console.log('\n📚 Sample documentable files:');
    console.table(docFiles);
  }
  
} catch (error) {
  console.error('❌ Scan failed:', error.message);
  if (error.code === 'ENOENT') {
    console.log('💡 The path might not exist or be accessible');
  } else if (error.code === 'EACCES') {
    console.log('💡 Permission denied - check directory permissions');
  }
}

db.close();