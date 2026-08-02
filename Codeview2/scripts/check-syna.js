import { Database } from 'bun:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../backend/data/codebase.db');
const db = new Database(dbPath);

console.log('🔍 Checking Syna project...\n');

// Get Syna project details
const syna = db.prepare("SELECT * FROM projects WHERE name = 'Syna'").get();

if (!syna) {
  console.log('❌ Syna project not found in database!');
  process.exit(1);
}

console.log('📁 Syna Project Details:');
console.table(syna);

// Check if the path exists
console.log(`\n📂 Checking if path exists: ${syna.path}`);
const pathExists = existsSync(syna.path);
console.log(`Path exists: ${pathExists ? '✅ YES' : '❌ NO'}`);

if (!pathExists) {
  console.log('\n🚨 The path does not exist! This is why scanning failed.');
  console.log('\nPossible Syna project locations to check:');
  const possiblePaths = [
    '/home/jon/Projects/syna',
    '/home/jon/projects/syna', 
    '/home/jon/syna',
    '/home/jon/Projects/Syna',
    '/home/jon/work/syna',
    '/Projects/syna'
  ];
  
  for (const testPath of possiblePaths) {
    const exists = existsSync(testPath);
    console.log(`${exists ? '✅' : '❌'} ${testPath}`);
  }
}

// Check for any files that might have been scanned
const fileCount = db.prepare("SELECT COUNT(*) as count FROM file_nodes WHERE project_id = ?").get(syna.id);
console.log(`\n📄 Files in database for Syna: ${fileCount.count}`);

if (fileCount.count > 0) {
  const sampleFiles = db.prepare(`
    SELECT name, relative_path, type 
    FROM file_nodes 
    WHERE project_id = ? 
    LIMIT 10
  `).all(syna.id);
  
  console.log('\nSample files found:');
  console.table(sampleFiles);
}

db.close();