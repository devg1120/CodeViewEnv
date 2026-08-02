export async function fileRoutes(fastify) {
  // Get file tree for project
  fastify.get('/projects/:projectId/files', async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { search, searchField = 'name', filterStatus = 'all' } = request.query;

      let query = `
        SELECT 
          fn.*,
          fa.complexity,
          fa.maintainability,
          fa.test_coverage,
          fa.issues,
          gi.branch,
          gi.status as git_status,
          gi.author,
          gi.last_commit
        FROM file_nodes fn
        LEFT JOIN file_analysis fa ON fn.id = fa.file_id
        LEFT JOIN git_info gi ON fn.id = gi.file_id
        WHERE fn.project_id = ?
      `;

      const params = [projectId];

      // Add search filter
      if (search) {
        switch (searchField) {
          case 'name':
            query += ` AND fn.name LIKE ?`;
            params.push(`%${search}%`);
            break;
          case 'path':
            query += ` AND fn.path LIKE ?`;
            params.push(`%${search}%`);
            break;
          case 'extension':
            query += ` AND fn.extension LIKE ?`;
            params.push(`%${search}%`);
            break;
          case 'language':
            query += ` AND fn.language LIKE ?`;
            params.push(`%${search}%`);
            break;
          case 'author':
            query += ` AND gi.author LIKE ?`;
            params.push(`%${search}%`);
            break;
        }
      }

      // Add status filter
      if (filterStatus === 'modified') {
        query += ` AND gi.status != 'clean'`;
      } else if (filterStatus === 'issues') {
        query += ` AND fa.issues IS NOT NULL AND fa.issues != '[]'`;
      }

      query += ` ORDER BY fn.type DESC, fn.name ASC`;

      const files = fastify.db.prepare(query).all(...params);

      // Parse JSON fields
      const processedFiles = files.map(file => ({
        ...file,
        tags: file.tags ? JSON.parse(file.tags) : [],
        issues: file.issues ? JSON.parse(file.issues) : [],
        dependencies: file.dependencies ? JSON.parse(file.dependencies) : []
      }));

      return { files: processedFiles };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch files' });
    }
  });

  // Get file tree structure
  fastify.get('/projects/:projectId/tree', async (request, reply) => {
    try {
      const { projectId } = request.params;

      const files = fastify.db.prepare(`
        SELECT * FROM file_nodes 
        WHERE project_id = ? 
        ORDER BY path ASC
      `).all(projectId);

      // Build tree structure
      const tree = buildFileTree(files);

      return { tree };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch file tree' });
    }
  });

  // Get file content
  fastify.get('/files/:fileId/content', async (request, reply) => {
    try {
      const { fileId } = request.params;

      const file = fastify.db.prepare(`
        SELECT * FROM file_nodes WHERE id = ?
      `).get(fileId);

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      if (file.type === 'directory') {
        return reply.code(400).send({ error: 'Cannot read directory content' });
      }

      // Read file content from filesystem
      const fs = await import('fs/promises');
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        return { content, file };
      } catch (fsError) {
        return reply.code(404).send({ error: 'File not found on filesystem' });
      }
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to read file content' });
    }
  });

  // Bulk file operations
  fastify.post('/files/bulk-action', async (request, reply) => {
    try {
      const { action, fileIds } = request.body;

      if (!action || !Array.isArray(fileIds)) {
        return reply.code(400).send({ error: 'Action and fileIds array are required' });
      }

      const results = [];

      switch (action) {
        case 'analyze':
          // Trigger analysis for selected files
          for (const fileId of fileIds) {
            // This would trigger your analysis service
            results.push({ fileId, status: 'analysis_queued' });
          }
          break;

        case 'copy-paths':
          const files = fastify.db.prepare(`
            SELECT path FROM file_nodes WHERE id IN (${fileIds.map(() => '?').join(',')})
          `).all(...fileIds);
          
          const paths = files.map(f => f.path);
          return { paths };

        case 'delete':
          // This would be dangerous - implement with caution
          return reply.code(400).send({ error: 'Delete operation not implemented for safety' });

        default:
          return reply.code(400).send({ error: 'Unknown action' });
      }

      return { results };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to execute bulk action' });
    }
  });
}

function buildFileTree(files) {
  const tree = [];
  const pathMap = new Map();

  // Sort files by path depth
  files.sort((a, b) => a.path.split('/').length - b.path.split('/').length);

  for (const file of files) {
    const pathParts = file.relative_path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    const node = {
      id: file.id,
      name: fileName,
      type: file.type,
      path: file.path,
      size: file.size,
      extension: file.extension,
      language: file.language,
      lastModified: file.last_modified,
      children: file.type === 'directory' ? [] : undefined
    };

    if (pathParts.length === 1) {
      // Root level
      tree.push(node);
      pathMap.set(file.relative_path, node);
    } else {
      // Find parent
      const parentPath = pathParts.slice(0, -1).join('/');
      const parent = pathMap.get(parentPath);
      
      if (parent && parent.children) {
        parent.children.push(node);
      }
      
      pathMap.set(file.relative_path, node);
    }
  }

  return tree;
}