import { randomUUID } from 'crypto';
import { scanRepository } from '../services/repositoryScanner.js';

export async function projectRoutes(fastify) {
  // Get all projects
  fastify.get('/projects', async (request, reply) => {
    try {
      const projects = fastify.db.prepare(`
        SELECT 
          id,
          name,
          path,
          description,
          language,
          last_analyzed as lastAnalyzed,
          quality_score as qualityScore,
          lines_of_code as linesOfCode,
          files_count as files,
          dependencies_count as dependencies,
          created_at as createdAt,
          updated_at as updatedAt
        FROM projects ORDER BY updated_at DESC
      `).all();

      return { projects };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch projects' });
    }
  });

  // Get project by ID
  fastify.get('/projects/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const project = fastify.db.prepare(`
        SELECT 
          id,
          name,
          path,
          description,
          language,
          last_analyzed as lastAnalyzed,
          quality_score as qualityScore,
          lines_of_code as linesOfCode,
          files_count as files,
          dependencies_count as dependencies,
          created_at as createdAt,
          updated_at as updatedAt
        FROM projects WHERE id = ?
      `).get(id);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return { project };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch project' });
    }
  });

  // Create/scan new project
  fastify.post('/projects/scan', async (request, reply) => {
    try {
      const { path, name, description } = request.body;

      if (!path || !name) {
        return reply.code(400).send({ error: 'Path and name are required' });
      }

      // Check if path exists before creating project
      try {
        const fs = await import('fs');
        if (!fs.existsSync(path)) {
          return reply.code(400).send({ 
            error: 'Path does not exist',
            details: `The directory '${path}' was not found. Please check the path and try again.`,
            path: path
          });
        }
        
        // Check if directory is readable
        try {
          fs.readdirSync(path);
        } catch (permError) {
          return reply.code(400).send({ 
            error: 'Cannot access directory',
            details: `Permission denied or unable to read directory '${path}'`,
            path: path
          });
        }
      } catch (fsError) {
        fastify.log.error('File system error:', fsError);
        return reply.code(500).send({ error: 'File system error occurred' });
      }

      const projectId = randomUUID();
      
      // Insert project
      const insertProject = fastify.db.prepare(`
        INSERT INTO projects (id, name, path, description)
        VALUES (?, ?, ?, ?)
      `);

      insertProject.run(projectId, name, path, description || '');

      // Scan repository and return immediate feedback
      try {
        await scanRepository(fastify.db, projectId, path);
        
        // Get updated project with stats
        const project = fastify.db.prepare(`
          SELECT 
            id, name, path, description, files_count, lines_of_code, last_analyzed
          FROM projects WHERE id = ?
        `).get(projectId);
        
        fastify.log.info(`Repository scan completed for project ${projectId}: ${project.files_count} files`);
        
        return { 
          projectId, 
          message: 'Project created and scanned successfully',
          status: 'completed',
          filesFound: project.files_count,
          linesOfCode: project.lines_of_code
        };
      } catch (scanError) {
        // Scan failed, but project was created - mark it with error
        fastify.db.prepare(`
          UPDATE projects 
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(projectId);
        
        fastify.log.error(`Repository scan failed for project ${projectId}:`, scanError);
        
        return reply.code(400).send({ 
          error: 'Scan failed',
          details: scanError.message,
          projectId: projectId,
          suggestion: 'Check the path and permissions, then try rescanning the project'
        });
      }
    } catch (error) {
      fastify.log.error('Project creation error:', error);
      reply.code(500).send({ error: 'Failed to create project' });
    }
  });

  // Rescan project
  fastify.post('/projects/:id/rescan', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Get project
      const project = fastify.db.prepare(`
        SELECT * FROM projects WHERE id = ?
      `).get(id);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      // Check if path still exists
      try {
        const fs = await import('fs');
        if (!fs.existsSync(project.path)) {
          return reply.code(400).send({ 
            error: 'Path no longer exists',
            details: `The directory '${project.path}' was not found. Please update the project path.`,
            path: project.path
          });
        }
      } catch (fsError) {
        return reply.code(500).send({ error: 'File system error occurred' });
      }

      // Clear existing files
      fastify.db.prepare('DELETE FROM file_nodes WHERE project_id = ?').run(id);
      
      // Reset project stats
      fastify.db.prepare(`
        UPDATE projects 
        SET files_count = 0, lines_of_code = 0, last_analyzed = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      try {
        // Rescan the project
        await scanRepository(fastify.db, id, project.path);
        
        // Get updated stats
        const updatedProject = fastify.db.prepare(`
          SELECT files_count, lines_of_code, last_analyzed 
          FROM projects WHERE id = ?
        `).get(id);
        
        fastify.log.info(`Repository rescan completed for project ${id}: ${updatedProject.files_count} files`);
        
        return { 
          message: 'Project rescanned successfully',
          status: 'completed',
          filesFound: updatedProject.files_count,
          linesOfCode: updatedProject.lines_of_code,
          lastAnalyzed: updatedProject.last_analyzed
        };
      } catch (scanError) {
        fastify.log.error(`Repository rescan failed for project ${id}:`, scanError);
        
        return reply.code(400).send({ 
          error: 'Rescan failed',
          details: scanError.message,
          suggestion: 'Check the path and permissions'
        });
      }
    } catch (error) {
      fastify.log.error('Rescan error:', error);
      reply.code(500).send({ error: 'Failed to rescan project' });
    }
  });

  // Delete project
  fastify.delete('/projects/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const deleteProject = fastify.db.prepare(`
        DELETE FROM projects WHERE id = ?
      `);

      const result = deleteProject.run(id);

      if (result.changes === 0) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return { message: 'Project deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to delete project' });
    }
  });
}