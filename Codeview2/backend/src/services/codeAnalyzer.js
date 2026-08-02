import { readFile } from 'fs/promises';
import { randomUUID } from 'crypto';

export async function analyzeFile(filePath, extension) {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Basic analysis - you can enhance this with real tools
    const analysis = {
      complexity: calculateComplexity(content, extension),
      maintainability: calculateMaintainability(content, extension),
      testCoverage: estimateTestCoverage(filePath, content),
      dependencies: extractDependencies(content, extension),
      issues: findIssues(content, extension)
    };

    return analysis;
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return {
      complexity: 0,
      maintainability: 50,
      testCoverage: 0,
      dependencies: [],
      issues: []
    };
  }
}

function calculateComplexity(content, extension) {
  // Simple complexity calculation based on control structures
  const lines = content.split('\n');
  let complexity = 1; // Base complexity
  
  const complexityPatterns = [
    /\bif\b/g,
    /\belse\b/g,
    /\bwhile\b/g,
    /\bfor\b/g,
    /\bswitch\b/g,
    /\bcatch\b/g,
    /\btry\b/g,
    /\?\s*:/g, // Ternary operator
  ];

  for (const line of lines) {
    for (const pattern of complexityPatterns) {
      const matches = line.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
  }

  // Normalize to 0-10 scale
  return Math.min(10, Math.max(1, complexity / 10));
}

function calculateMaintainability(content, extension) {
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  let score = 100;
  
  // Penalize long files
  if (nonEmptyLines.length > 500) score -= 20;
  else if (nonEmptyLines.length > 200) score -= 10;
  
  // Penalize long lines
  const longLines = nonEmptyLines.filter(line => line.length > 120);
  score -= Math.min(20, longLines.length);
  
  // Penalize lack of comments
  const commentLines = nonEmptyLines.filter(line => 
    line.trim().startsWith('//') || 
    line.trim().startsWith('/*') || 
    line.trim().startsWith('*') ||
    line.trim().startsWith('#')
  );
  
  const commentRatio = commentLines.length / nonEmptyLines.length;
  if (commentRatio < 0.1) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

function estimateTestCoverage(filePath, content) {
  // Check if this is a test file
  if (filePath.includes('test') || filePath.includes('spec')) {
    return 100; // Test files have 100% coverage by definition
  }
  
  // Look for corresponding test files (simplified)
  const hasTests = content.includes('test') || content.includes('spec');
  
  // Simple heuristic based on file characteristics
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];
  
  if (functions.length === 0) return 0;
  
  // Estimate coverage based on various factors
  let coverage = hasTests ? 60 : 20;
  
  // Smaller files tend to have better coverage
  if (lines.length < 50) coverage += 20;
  else if (lines.length < 100) coverage += 10;
  
  return Math.min(100, Math.max(0, coverage));
}

function extractDependencies(content, extension) {
  const dependencies = [];
  
  // Extract import statements
  const importPatterns = [
    /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /#include\s*<([^>]+)>/g,
    /#include\s*"([^"]+)"/g,
  ];

  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
  }

  return [...new Set(dependencies)]; // Remove duplicates
}

function findIssues(content, extension) {
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for common issues
    if (line.length > 120) {
      issues.push({
        id: randomUUID(),
        type: 'warning',
        severity: 'low',
        message: 'Line too long (>120 characters)',
        line: lineNumber,
        column: 121,
        rule: 'line-length'
      });
    }
    
    if (line.includes('console.log') && extension === 'js') {
      issues.push({
        id: randomUUID(),
        type: 'warning',
        severity: 'medium',
        message: 'Console.log statement found',
        line: lineNumber,
        column: line.indexOf('console.log') + 1,
        rule: 'no-console'
      });
    }
    
    if (line.includes('TODO') || line.includes('FIXME')) {
      issues.push({
        id: randomUUID(),
        type: 'info',
        severity: 'low',
        message: 'TODO/FIXME comment found',
        line: lineNumber,
        column: Math.max(line.indexOf('TODO'), line.indexOf('FIXME')) + 1,
        rule: 'todo-comment'
      });
    }
    
    // Check for potential security issues
    if (line.includes('eval(') || line.includes('innerHTML')) {
      issues.push({
        id: randomUUID(),
        type: 'error',
        severity: 'high',
        message: 'Potential security vulnerability',
        line: lineNumber,
        column: Math.max(line.indexOf('eval('), line.indexOf('innerHTML')) + 1,
        rule: 'security'
      });
    }
  });
  
  return issues;
}