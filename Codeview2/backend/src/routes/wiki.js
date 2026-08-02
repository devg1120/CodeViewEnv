import { WikiGenerator } from '../services/wikiGenerator.js';

export async function wikiRoutes(fastify) {
  const wikiGenerator = new WikiGenerator(fastify.db);

  // Get wiki documentation for a project
  fastify.get('/projects/:id/wiki', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Check if project exists
      const project = fastify.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const wikiDocs = await wikiGenerator.generateWikiForProject(id);
      
      return { 
        docs: wikiDocs,
        projectName: project.name 
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to generate wiki documentation' });
    }
  });

  // Get specific wiki document content
  fastify.get('/projects/:id/wiki/:docId', async (request, reply) => {
    try {
      const { id, docId } = request.params;
      
      // Check if project exists
      const project = fastify.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const wikiDocs = await wikiGenerator.generateWikiForProject(id);
      const doc = wikiDocs.find(d => d.id === docId);
      
      if (!doc) {
        return reply.code(404).send({ error: 'Wiki document not found' });
      }
      
      return { doc };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch wiki document' });
    }
  });
}