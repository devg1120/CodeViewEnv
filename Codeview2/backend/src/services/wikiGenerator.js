import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export class WikiGenerator {
  constructor(db) {
    this.db = db;
  }

  async generateWikiForProject(projectId) {
    try {
      // Get project info
      const project = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Get all files for the project
      const files = this.db.prepare(`
        SELECT * FROM file_nodes 
        WHERE project_id = ? AND type = 'file'
        ORDER BY relative_path
      `).all(projectId);

      const wikiDocs = [];

      // 1. Generate docs from README files
      const readmeFiles = files.filter(file => 
        file.name.toLowerCase().includes('readme') && 
        (file.extension === 'md' || file.extension === 'txt')
      );

      for (const readmeFile of readmeFiles) {
        const readmeDoc = await this.generateReadmeDoc(project, readmeFile);
        if (readmeDoc) wikiDocs.push(readmeDoc);
      }

      // 2. Generate API documentation from code files
      const apiFiles = files.filter(file => 
        file.relative_path.includes('/routes/') || 
        file.relative_path.includes('/api/') ||
        file.relative_path.includes('controller') ||
        (file.extension === 'js' || file.extension === 'ts') && 
        file.relative_path.includes('server')
      );

      for (const apiFile of apiFiles) {
        const apiDoc = await this.generateApiDoc(project, apiFile);
        if (apiDoc) wikiDocs.push(apiDoc);
      }

      // 3. Generate component documentation
      const componentFiles = files.filter(file => 
        file.relative_path.includes('/components/') &&
        (file.extension === 'tsx' || file.extension === 'jsx' || file.extension === 'vue')
      );

      for (const componentFile of componentFiles) {
        const componentDoc = await this.generateComponentDoc(project, componentFile);
        if (componentDoc) wikiDocs.push(componentDoc);
      }

      // 4. Generate configuration documentation
      const configFiles = files.filter(file => 
        file.name.includes('config') ||
        file.name === 'package.json' ||
        file.name.includes('.env') ||
        file.name.includes('docker')
      );

      for (const configFile of configFiles) {
        const configDoc = await this.generateConfigDoc(project, configFile);
        if (configDoc) wikiDocs.push(configDoc);
      }

      // 5. Generate test documentation
      const testFiles = files.filter(file => 
        file.relative_path.includes('/test') || 
        file.relative_path.includes('/spec') ||
        file.name.includes('.test.') ||
        file.name.includes('.spec.')
      );

      if (testFiles.length > 0) {
        const testDoc = this.generateTestOverviewDoc(project, testFiles);
        wikiDocs.push(testDoc);
      }

      return wikiDocs;

    } catch (error) {
      console.error('Error generating wiki for project:', error);
      throw error;
    }
  }

  async generateReadmeDoc(project, readmeFile) {
    try {
      const content = await this.readFileContent(project.path, readmeFile.relative_path);
      if (!content) return null;

      return {
        id: randomUUID(),
        title: `${readmeFile.name} - ${project.name}`,
        content: content,
        category: 'Documentation',
        tags: ['readme', 'documentation', 'getting-started'],
        lastUpdated: readmeFile.last_modified || new Date().toISOString(),
        author: 'Project Team',
        type: 'readme',
        sourceFile: readmeFile.relative_path
      };
    } catch (error) {
      console.error('Error generating README doc:', error);
      return null;
    }
  }

  async generateApiDoc(project, apiFile) {
    try {
      const content = await this.readFileContent(project.path, apiFile.relative_path);
      if (!content) return null;

      // Extract API endpoints and operations
      const endpoints = this.extractApiEndpoints(content);
      if (endpoints.length === 0) return null;

      const docContent = this.formatApiDocumentation(endpoints, content);

      return {
        id: randomUUID(),
        title: `API: ${path.basename(apiFile.name, path.extname(apiFile.name))}`,
        content: docContent,
        category: 'API',
        tags: ['api', 'endpoints', 'backend'],
        lastUpdated: apiFile.last_modified || new Date().toISOString(),
        author: 'Backend Team',
        type: 'api',
        sourceFile: apiFile.relative_path
      };
    } catch (error) {
      console.error('Error generating API doc:', error);
      return null;
    }
  }

  async generateComponentDoc(project, componentFile) {
    try {
      const content = await this.readFileContent(project.path, componentFile.relative_path);
      if (!content) return null;

      // Extract component info
      const componentInfo = this.extractComponentInfo(content);
      if (!componentInfo.name) return null;

      const docContent = this.formatComponentDocumentation(componentInfo, content);

      return {
        id: randomUUID(),
        title: `Component: ${componentInfo.name}`,
        content: docContent,
        category: 'Components',
        tags: ['component', 'frontend', 'ui'],
        lastUpdated: componentFile.last_modified || new Date().toISOString(),
        author: 'Frontend Team',
        type: 'documentation',
        sourceFile: componentFile.relative_path
      };
    } catch (error) {
      console.error('Error generating component doc:', error);
      return null;
    }
  }

  async generateConfigDoc(project, configFile) {
    try {
      const content = await this.readFileContent(project.path, configFile.relative_path);
      if (!content) return null;

      const docContent = this.formatConfigDocumentation(configFile, content);

      return {
        id: randomUUID(),
        title: `Configuration: ${configFile.name}`,
        content: docContent,
        category: 'Configuration',
        tags: ['config', 'setup', 'environment'],
        lastUpdated: configFile.last_modified || new Date().toISOString(),
        author: 'DevOps Team',
        type: 'documentation',
        sourceFile: configFile.relative_path
      };
    } catch (error) {
      console.error('Error generating config doc:', error);
      return null;
    }
  }

  generateTestOverviewDoc(project, testFiles) {
    const testsByDirectory = {};
    testFiles.forEach(file => {
      const dir = path.dirname(file.relative_path);
      if (!testsByDirectory[dir]) testsByDirectory[dir] = [];
      testsByDirectory[dir].push(file);
    });

    const content = this.formatTestDocumentation(testsByDirectory);

    return {
      id: randomUUID(),
      title: `Test Coverage Overview - ${project.name}`,
      content: content,
      category: 'Testing',
      tags: ['testing', 'coverage', 'quality'],
      lastUpdated: new Date().toISOString(),
      author: 'QA Team',
      type: 'documentation',
      sourceFile: 'multiple'
    };
  }

  async readFileContent(projectPath, relativePath) {
    try {
      const fullPath = path.join(projectPath, relativePath);
      const stats = fs.statSync(fullPath);
      
      // Don't read very large files
      if (stats.size > 1024 * 1024) { // 1MB limit
        return `# ${path.basename(relativePath)}\n\n*File too large to display (${Math.round(stats.size / 1024)}KB)*`;
      }

      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  extractApiEndpoints(content) {
    const endpoints = [];
    
    // Match common route patterns
    const routePatterns = [
      /(?:app|router|fastify)\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /@(?:Get|Post|Put|Delete|Patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /Route\s*\[\s*['"`]([^'"`]+)['"`]\s*\]/gi
    ];

    const methodPatterns = [
      /(?:app|router|fastify)\.(get|post|put|delete|patch)\s*\(/gi,
      /@(Get|Post|Put|Delete|Patch)/gi
    ];

    let match;
    for (const pattern of routePatterns) {
      while ((match = pattern.exec(content)) !== null) {
        endpoints.push({
          path: match[1],
          method: 'GET', // Default, will be updated by method patterns
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }

    return endpoints;
  }

  extractComponentInfo(content) {
    const info = {};
    
    // Extract component name
    const componentMatch = content.match(/(?:export\s+(?:default\s+)?function\s+(\w+)|export\s+const\s+(\w+)\s*=|function\s+(\w+)\s*\()/);
    if (componentMatch) {
      info.name = componentMatch[1] || componentMatch[2] || componentMatch[3];
    }

    // Extract props interface
    const propsMatch = content.match(/interface\s+(\w*Props)\s*\{([^}]+)\}/);
    if (propsMatch) {
      info.props = propsMatch[2];
    }

    // Extract imports
    const importMatches = content.match(/import\s+.*?from\s+['"`]([^'"`]+)['"`]/g);
    if (importMatches) {
      info.dependencies = importMatches.map(imp => imp.match(/from\s+['"`]([^'"`]+)['"`]/)[1]);
    }

    return info;
  }

  formatApiDocumentation(endpoints, content) {
    let doc = `# API Documentation\n\n`;
    
    if (endpoints.length > 0) {
      doc += `## Endpoints\n\n`;
      
      endpoints.forEach(endpoint => {
        doc += `### ${endpoint.method} ${endpoint.path}\n\n`;
        
        // Try to extract comments before the endpoint
        const lines = content.split('\n');
        const endpointLine = endpoint.line - 1;
        
        for (let i = endpointLine - 1; i >= 0; i--) {
          const line = lines[i]?.trim();
          if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
            doc += `${line.replace(/^\/\/\s*|^\*\s*|^\/\*\s*/, '')}\n`;
          } else if (line) {
            break;
          }
        }
        
        doc += `\n`;
      });
    }

    doc += `\n## Source Code\n\n\`\`\`javascript\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}\n\`\`\`\n`;
    
    return doc;
  }

  formatComponentDocumentation(componentInfo, content) {
    let doc = `# ${componentInfo.name} Component\n\n`;
    
    if (componentInfo.props) {
      doc += `## Props\n\n\`\`\`typescript\n${componentInfo.props}\n\`\`\`\n\n`;
    }
    
    if (componentInfo.dependencies && componentInfo.dependencies.length > 0) {
      doc += `## Dependencies\n\n`;
      componentInfo.dependencies.forEach(dep => {
        doc += `- ${dep}\n`;
      });
      doc += `\n`;
    }
    
    // Extract JSDoc comments
    const jsdocMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    if (jsdocMatch) {
      doc += `## Description\n\n${jsdocMatch[0]}\n\n`;
    }
    
    doc += `## Source Code\n\n\`\`\`typescript\n${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}\n\`\`\`\n`;
    
    return doc;
  }

  formatConfigDocumentation(configFile, content) {
    let doc = `# ${configFile.name}\n\n`;
    
    if (configFile.name === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        doc += `## Package Information\n\n`;
        doc += `- **Name**: ${pkg.name}\n`;
        doc += `- **Version**: ${pkg.version}\n`;
        doc += `- **Description**: ${pkg.description}\n\n`;
        
        if (pkg.scripts) {
          doc += `## Scripts\n\n`;
          Object.entries(pkg.scripts).forEach(([script, command]) => {
            doc += `- **${script}**: \`${command}\`\n`;
          });
          doc += `\n`;
        }
        
        if (pkg.dependencies) {
          doc += `## Dependencies\n\n`;
          Object.keys(pkg.dependencies).forEach(dep => {
            doc += `- ${dep}\n`;
          });
          doc += `\n`;
        }
      } catch (error) {
        doc += `*Error parsing package.json*\n\n`;
      }
    }
    
    doc += `## Configuration\n\n\`\`\`\n${content}\n\`\`\`\n`;
    
    return doc;
  }

  formatTestDocumentation(testsByDirectory) {
    let doc = `# Test Coverage Overview\n\n`;
    
    Object.entries(testsByDirectory).forEach(([directory, files]) => {
      doc += `## ${directory}\n\n`;
      files.forEach(file => {
        doc += `- ${file.name}\n`;
      });
      doc += `\n`;
    });
    
    return doc;
  }
}