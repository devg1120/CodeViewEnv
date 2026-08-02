export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  language: string;
  lastAnalyzed: string;
  qualityScore: number;
  linesOfCode: number;
  files: number;
  dependencies: number;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  extension?: string;
  children?: FileNode[];
  lastModified: string;
  language?: string;
  tags?: string[];
}

export interface WikiDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  author: string;
  type: 'documentation' | 'readme' | 'guide' | 'api' | 'changelog';
}

export interface FlowChartNode {
  id: string;
  label: string;
  type: 'function' | 'class' | 'module' | 'component' | 'service';
  position: { x: number; y: number };
  dependencies: string[];
  complexity: number;
  description?: string;
}

export interface QualityMetric {
  name: string;
  value: number;
  max: number;
  status: 'good' | 'warning' | 'error';
  description: string;
}

export interface FileAnalysis {
  id: string;
  fileId: string;
  complexity: number;
  maintainability: number;
  testCoverage: number;
  dependencies: string[];
  issues: CodeIssue[];
  lastAnalyzed: string;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  action: (files: FileNode[]) => void;
  requiresAnalysis?: boolean;
  dangerous?: boolean;
}

export interface SearchFilter {
  field: 'name' | 'path' | 'extension' | 'language' | 'content' | 'author' | 'tags';
  label: string;
  placeholder: string;
}

export interface CodeIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  message: string;
  line?: number;
  column?: number;
  rule?: string;
}

export interface CodeSuggestion {
  id: string;
  type: 'improvement' | 'warning' | 'error';
  severity: 'low' | 'medium' | 'high';
  message: string;
  line?: number;
  column?: number;
  rule?: string;
}

export interface LLMAnalysisResult {
  suggestions: CodeSuggestion[];
  complexity: number;
  maintainability: number;
  securityIssues: string[];
  performanceTips: string[];
  summary: string;
}

export interface GitInfo {
  branch: string;
  lastCommit: string;
  author: string;
  status: 'clean' | 'modified' | 'staged' | 'untracked';
}