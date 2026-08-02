import { randomUUID } from 'crypto';
import { glob } from 'glob';
import { statSync } from 'fs';
import { join, relative, extname, basename } from 'path';
import { simpleGit } from 'simple-git';
import { getLanguageFromExtension } from '../utils/languageDetector.js';

export async function scanRepository(db, projectId, repositoryPath) {
  try {
    console.log(`Starting repository scan for ${repositoryPath}`);
    
    // Initialize git
    const git = simpleGit(repositoryPath);
    let isGitRepo = false;
    let gitBranch = 'main';
    
    try {
      await git.status();
      isGitRepo = true;
      gitBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    } catch (error) {
      console.log('Not a git repository or git not available');
    }

    // Scan all files with better filtering
    const allPaths = await glob('**/*', { 
      cwd: repositoryPath,
      dot: false,
      ignore: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '.next/**',
        'coverage/**',
        '**/*.log',
        '**/.DS_Store',
        '**/npm-debug.log*',
        '**/yarn-debug.log*',
        '**/yarn-error.log*',
        '**/.npm',
        '**/.eslintcache',
        '**/package-lock.json',
        '**/yarn.lock',
        '**/pnpm-lock.yaml'
      ]
    });

    console.log(`Found ${allPaths.length} paths to process`);

    const insertFile = db.prepare(`
      INSERT OR REPLACE INTO file_nodes 
      (id, project_id, name, type, path, relative_path, size, extension, language, tags, last_modified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertGitInfo = db.prepare(`
      INSERT OR REPLACE INTO git_info 
      (id, file_id, branch, last_commit, author, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let processedCount = 0;
    const batchSize = 100;

    // Process files in batches
    for (let i = 0; i < allPaths.length; i += batchSize) {
      const batch = allPaths.slice(i, i + batchSize);
      
      const transaction = db.transaction(() => {
        for (const relativePath of batch) {
          const fullPath = join(repositoryPath, relativePath);
          try {
            processFileSync(
              fullPath, 
              relativePath,
              repositoryPath, 
              projectId, 
              insertFile, 
              insertGitInfo, 
              git, 
              isGitRepo, 
              gitBranch
            );
            processedCount++;
          } catch (error) {
            console.error(`Error processing file ${fullPath}:`, error.message);
          }
        }
      });

      transaction();
      
      if (processedCount % 500 === 0) {
        console.log(`Processed ${processedCount}/${allPaths.length} files`);
      }
    }

    // Update project statistics
    updateProjectStats(db, projectId);

    console.log(`Repository scan completed. Processed ${processedCount} files.`);
    
  } catch (error) {
    console.error('Repository scan failed:', error);
    throw error;
  }
}

function processFileSync(fullPath, relativePath, repositoryPath, projectId, insertFile, insertGitInfo, git, isGitRepo, gitBranch) {
  const stats = statSync(fullPath);
  const fileName = basename(fullPath);
  const extension = extname(fullPath).slice(1);
  const language = getLanguageFromExtension(extension);
  
  const fileId = randomUUID();
  const isDirectory = stats.isDirectory();
  
  // Determine tags based on file characteristics
  const tags = [];
  if (fileName.includes('test') || fileName.includes('spec')) {
    tags.push('test');
  }
  if (fileName.includes('config')) {
    tags.push('config');
  }
  if (extension === 'md') {
    tags.push('documentation');
  }

  // Insert file record
  insertFile.run(
    fileId,
    projectId,
    fileName,
    isDirectory ? 'directory' : 'file',
    fullPath,
    relativePath,
    isDirectory ? null : stats.size,
    isDirectory ? null : extension,
    isDirectory ? null : language,
    JSON.stringify(tags),
    stats.mtime.toISOString()
  );

  // Skip git info for now to keep it simple and fast
  // We can add git integration later if needed
}

function updateProjectStats(db, projectId) {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as files_count,
      SUM(CASE WHEN size IS NOT NULL THEN size ELSE 0 END) as total_size,
      COUNT(DISTINCT language) as language_count
    FROM file_nodes 
    WHERE project_id = ? AND type = 'file'
  `).get(projectId);

  // Count lines of code (rough estimate based on file sizes)
  const avgBytesPerLine = 50; // Rough estimate
  const estimatedLOC = Math.round((stats.total_size || 0) / avgBytesPerLine);

  const updateProject = db.prepare(`
    UPDATE projects 
    SET 
      files_count = ?,
      lines_of_code = ?,
      last_analyzed = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  updateProject.run(stats.files_count, estimatedLOC, projectId);
}