import { Database } from 'bun:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../backend/data/codebase.db');
const db = new Database(dbPath);

// Get project name from command line argument
const projectName = process.argv[2];

if (!projectName) {
  console.log('Usage: bun run scripts/debug-project.js <project-name>');
  console.log('\nAvailable projects:');
  const projects = db.prepare('SELECT name FROM projects ORDER BY name').all();
  projects.forEach(p => console.log(`  - ${p.name}`));
  process.exit(1);
}

console.log(`🔍 Debugging project: ${projectName}\n`);

// Get project details
const project = db.prepare("SELECT * FROM projects WHERE name = ?").get(projectName);

if (!project) {
  console.log(`❌ Project '${projectName}' not found in database!`);
  console.log('\nAvailable projects:');
  const projects = db.prepare('SELECT name FROM projects ORDER BY name').all();
  projects.forEach(p => console.log(`  - ${p.name}`));
  process.exit(1);
}

console.log('📁 Project Details:');
console.table({
  'Name': project.name,
  'Path': project.path,
  'Files Count': project.files_count,
  'Lines of Code': project.lines_of_code,
  'Last Analyzed': project.last_analyzed || 'Never',
  'Created': project.created_at
});

// Check if path exists
console.log(`\n📂 Path Check: ${project.path}`);
const pathExists = existsSync(project.path);
console.log(`Status: ${pathExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

if (!pathExists) {
  console.log('\n🔍 Searching for similar paths...');
  // Try to find alternative paths
  const homePath = `/home/${process.env.USER || 'jon'}`;
  const possiblePaths = [
    `${homePath}/Projects/${projectName.toLowerCase()}`,
    `${homePath}/projects/${projectName.toLowerCase()}`,
    `${homePath}/${projectName.toLowerCase()}`,
    `${homePath}/Projects/${projectName}`,
    `${homePath}/work/${projectName.toLowerCase()}`,
    `/Projects/${projectName.toLowerCase()}`
  ];
  
  console.log('Checking possible locations:');
  possiblePaths.forEach(testPath => {
    const exists = existsSync(testPath);
    console.log(`${exists ? '✅' : '❌'} ${testPath}`);
    
    if (exists) {
      try {
        const contents = readdirSync(testPath);
        console.log(`   Contains: ${contents.slice(0, 5).join(', ')}${contents.length > 5 ? '...' : ''}`);
      } catch (e) {
        console.log('   (Cannot read directory)');
      }
    }
  });
} else {
  // Path exists, check contents
  try {
    const contents = readdirSync(project.path);
    console.log(`Directory contains ${contents.length} items:`);
    console.log(contents.slice(0, 10).join(', ') + (contents.length > 10 ? '...' : ''));
    
    // Check for common project files
    const commonFiles = ['package.json', 'README.md', 'src', 'index.js', 'index.ts', '.git'];
    const foundFiles = commonFiles.filter(file => contents.includes(file));
    if (foundFiles.length > 0) {
      console.log(`\n📄 Project files found: ${foundFiles.join(', ')}`);
    }
  } catch (e) {
    console.log(`❌ Cannot read directory: ${e.message}`);
  }
}

// Check database files
const fileCount = db.prepare("SELECT COUNT(*) as count FROM file_nodes WHERE project_id = ?").get(project.id);
console.log(`\n📄 Files in database: ${fileCount.count}`);

if (fileCount.count > 0) {
  const fileTypes = db.prepare(`
    SELECT extension, COUNT(*) as count 
    FROM file_nodes 
    WHERE project_id = ? AND type = 'file' AND extension IS NOT NULL
    GROUP BY extension 
    ORDER BY count DESC 
    LIMIT 5
  `).all(project.id);
  
  console.log('\nTop file types:');
  console.table(fileTypes);
  
  const sampleFiles = db.prepare(`
    SELECT name, relative_path, type 
    FROM file_nodes 
    WHERE project_id = ? 
    ORDER BY type DESC, name
    LIMIT 10
  `).all(project.id);
  
  console.log('\nSample files:');
  console.table(sampleFiles);
}

console.log('\n💡 Recommendations:');
if (!pathExists) {
  console.log('- Update the project path to the correct location');
  console.log('- Delete and re-add the project with the correct path');
} else if (fileCount.count === 0) {
  console.log('- The path exists but no files were scanned');
  console.log('- Check if the directory has read permissions');
  console.log('- Try rescanning the project');
} else {
  console.log('- Project looks healthy!');
  console.log('- Files are properly scanned and stored');
}

db.close();