import { randomUUID } from 'crypto';
import { analyzeFile } from '../services/codeAnalyzer.js';
import { analyzeFileWithLLM } from '../services/llm/codeAnalyzer.js';

export async function analysisRoutes(fastify) {
  // Analyze single file
  fastify.post('/files/:fileId/analyze', async (request, reply) => {
    try {
      const { fileId } = request.params;

      const file = fastify.db.prepare(`
        SELECT * FROM file_nodes WHERE id = ?
      `).get(fileId);

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      if (file.type === 'directory') {
        return reply.code(400).send({ error: 'Cannot analyze directory' });
      }

      // Perform analysis
      const analysis = await analyzeFile(file.path, file.extension);

      // Store analysis results
      const analysisId = randomUUID();
      const insertAnalysis = fastify.db.prepare(`
        INSERT OR REPLACE INTO file_analysis 
        (id, file_id, complexity, maintainability, test_coverage, dependencies, issues)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertAnalysis.run(
        analysisId,
        fileId,
        analysis.complexity,
        analysis.maintainability,
        analysis.testCoverage,
        JSON.stringify(analysis.dependencies),
        JSON.stringify(analysis.issues)
      );

      return { analysis, analysisId };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to analyze file' });
    }
  });

  // Get analysis results
  fastify.get('/files/:fileId/analysis', async (request, reply) => {
    try {
      const { fileId } = request.params;

      const analysis = fastify.db.prepare(`
        SELECT * FROM file_analysis WHERE file_id = ?
      `).get(fileId);

      if (!analysis) {
        return reply.code(404).send({ error: 'Analysis not found' });
      }

      // Parse JSON fields
      const processedAnalysis = {
        ...analysis,
        dependencies: JSON.parse(analysis.dependencies || '[]'),
        issues: JSON.parse(analysis.issues || '[]')
      };

      return { analysis: processedAnalysis };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch analysis' });
    }
  });

  // LLM Analysis endpoint
  fastify.post('/files/:fileId/llm-analyze', async (request, reply) => {
    try {
      const { fileId } = request.params;

      const file = fastify.db.prepare(`
        SELECT * FROM file_nodes WHERE id = ?
      `).get(fileId);

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      if (file.type === 'directory') {
        return reply.code(400).send({ error: 'Cannot analyze directory' });
      }

      // Perform LLM analysis
      const llmAnalysis = await analyzeFileWithLLM(file.path);

      return { analysis: llmAnalysis };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to analyze file with LLM' });
    }
  });

  // Get project quality metrics
  fastify.get('/projects/:projectId/metrics', async (request, reply) => {
    try {
      const { projectId } = request.params;

      const metrics = fastify.db.prepare(`
        SELECT 
          COUNT(*) as total_files,
          AVG(fa.complexity) as avg_complexity,
          AVG(fa.maintainability) as avg_maintainability,
          AVG(fa.test_coverage) as avg_coverage,
          SUM(CASE WHEN fa.issues != '[]' THEN 1 ELSE 0 END) as files_with_issues
        FROM file_nodes fn
        LEFT JOIN file_analysis fa ON fn.id = fa.file_id
        WHERE fn.project_id = ? AND fn.type = 'file'
      `).get(projectId);

      const languageStats = fastify.db.prepare(`
        SELECT 
          language,
          COUNT(*) as count,
          SUM(size) as total_size
        FROM file_nodes 
        WHERE project_id = ? AND type = 'file' AND language IS NOT NULL
        GROUP BY language
        ORDER BY count DESC
      `).all(projectId);

      return { 
        metrics: {
          ...metrics,
          avg_complexity: Math.round((metrics.avg_complexity || 0) * 10) / 10,
          avg_maintainability: Math.round(metrics.avg_maintainability || 0),
          avg_coverage: Math.round(metrics.avg_coverage || 0)
        },
        languageStats 
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch metrics' });
    }
  });
}