import { Project, FileNode, WikiDocument, FlowChartNode, QualityMetric, FileAnalysis, GitInfo } from '../types';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'E-Commerce Platform',
    path: '/projects/ecommerce',
    description: 'Full-stack e-commerce solution with React and Node.js',
    language: 'TypeScript',
    lastAnalyzed: '2024-01-15T10:30:00Z',
    qualityScore: 87,
    linesOfCode: 45230,
    files: 234,
    dependencies: 67
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
    path: '/projects/analytics',
    description: 'Real-time analytics dashboard with data visualization',
    language: 'JavaScript',
    lastAnalyzed: '2024-01-14T15:45:00Z',
    qualityScore: 92,
    linesOfCode: 28450,
    files: 156,
    dependencies: 43
  },
  {
    id: '3',
    name: 'Mobile App Backend',
    path: '/projects/mobile-api',
    description: 'REST API backend for mobile applications',
    language: 'Python',
    lastAnalyzed: '2024-01-13T09:15:00Z',
    qualityScore: 78,
    linesOfCode: 15670,
    files: 89,
    dependencies: 34
  }
];

export const mockFileTree: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'directory',
    path: '/src',
    lastModified: '2024-01-15T10:30:00Z',
    children: [
      {
        id: '2',
        name: 'components',
        type: 'directory',
        path: '/src/components',
        lastModified: '2024-01-15T10:30:00Z',
        children: [
          {
            id: '3',
            name: 'Header.tsx',
            type: 'file',
            path: '/src/components/Header.tsx',
            size: 2340,
            extension: 'tsx',
            lastModified: '2024-01-15T10:30:00Z',
            language: 'TypeScript'
          },
          {
            id: '4',
            name: 'Navigation.tsx',
            type: 'file',
            path: '/src/components/Navigation.tsx',
            size: 1890,
            extension: 'tsx',
            lastModified: '2024-01-14T16:20:00Z',
            language: 'TypeScript'
          }
        ]
      },
      {
        id: '5',
        name: 'pages',
        type: 'directory',
        path: '/src/pages',
        lastModified: '2024-01-15T10:30:00Z',
        children: [
          {
            id: '6',
            name: 'Dashboard.tsx',
            type: 'file',
            path: '/src/pages/Dashboard.tsx',
            size: 4560,
            extension: 'tsx',
            lastModified: '2024-01-15T10:30:00Z',
            language: 'TypeScript'
          },
          {
            id: '7',
            name: 'Products.tsx',
            type: 'file',
            path: '/src/pages/Products.tsx',
            size: 3240,
            extension: 'tsx',
            lastModified: '2024-01-14T14:15:00Z',
            language: 'TypeScript'
          }
        ]
      },
      {
        id: '8',
        name: 'utils',
        type: 'directory',
        path: '/src/utils',
        lastModified: '2024-01-13T11:45:00Z',
        children: [
          {
            id: '9',
            name: 'api.ts',
            type: 'file',
            path: '/src/utils/api.ts',
            size: 1560,
            extension: 'ts',
            lastModified: '2024-01-13T11:45:00Z',
            language: 'TypeScript'
          },
          {
            id: '10',
            name: 'helpers.ts',
            type: 'file',
            path: '/src/utils/helpers.ts',
            size: 890,
            extension: 'ts',
            lastModified: '2024-01-12T09:30:00Z',
            language: 'TypeScript'
          }
        ],
        language: 'TypeScript',
        tags: ['utility', 'helper']
      }
    ]
  },
  {
    id: '11',
    name: 'public',
    type: 'directory',
    path: '/public',
    lastModified: '2024-01-10T08:00:00Z',
    children: [
      {
        id: '12',
        name: 'index.html',
        type: 'file',
        path: '/public/index.html',
        size: 1200,
        extension: 'html',
        lastModified: '2024-01-10T08:00:00Z',
        language: 'HTML',
        tags: ['template', 'public']
      }
    ]
  },
  {
    id: '13',
    name: 'tests',
    type: 'directory',
    path: '/tests',
    lastModified: '2024-01-14T12:00:00Z',
    children: [
      {
        id: '14',
        name: 'unit',
        type: 'directory',
        path: '/tests/unit',
        lastModified: '2024-01-14T12:00:00Z',
        children: [
          {
            id: '15',
            name: 'Header.test.tsx',
            type: 'file',
            path: '/tests/unit/Header.test.tsx',
            size: 1450,
            extension: 'tsx',
            lastModified: '2024-01-14T12:00:00Z',
            language: 'TypeScript',
            tags: ['test', 'unit']
          }
        ]
      }
    ]
  }
];

export const mockWikiDocuments: WikiDocument[] = [
  {
    id: '1',
    title: 'Getting Started Guide',
    content: `# Getting Started

This guide will help you set up and run the project locally.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

## Installation

1. Clone the repository
2. Install dependencies
3. Start the development server

## Configuration

Update the environment variables in \`.env\` file.`,
    category: 'Setup',
    tags: ['setup', 'installation', 'getting-started'],
    lastUpdated: '2024-01-15T10:30:00Z',
    author: 'Development Team',
    type: 'guide'
  },
  {
    id: '2',
    title: 'API Documentation',
    content: `# API Reference

## Authentication

All API requests require authentication using JWT tokens.

## Endpoints

### GET /api/users
Returns a list of users.

### POST /api/users
Creates a new user.

## Error Handling

The API returns standard HTTP status codes.`,
    category: 'API',
    tags: ['api', 'endpoints', 'authentication'],
    lastUpdated: '2024-01-14T15:45:00Z',
    author: 'Backend Team',
    type: 'api'
  },
  {
    id: '3',
    title: 'Component Architecture',
    content: `# Component Architecture

## Overview

Our component system follows atomic design principles.

## Structure

- Atoms: Basic building blocks
- Molecules: Simple combinations
- Organisms: Complex components
- Templates: Page layouts
- Pages: Complete views

## Best Practices

- Keep components small and focused
- Use TypeScript for type safety
- Write comprehensive tests`,
    category: 'Architecture',
    tags: ['components', 'architecture', 'design-system'],
    lastUpdated: '2024-01-13T12:20:00Z',
    author: 'Frontend Team',
    type: 'documentation'
  },
  {
    id: '4',
    title: 'Deployment Guide',
    content: `# Deployment

## Production Build

Run \`npm run build\` to create a production build.

## Environment Variables

Set the following variables:
- API_URL
- DATABASE_URL
- JWT_SECRET

## Docker

Use the provided Dockerfile for containerized deployment.`,
    category: 'DevOps',
    tags: ['deployment', 'docker', 'production'],
    lastUpdated: '2024-01-12T09:15:00Z',
    author: 'DevOps Team',
    type: 'guide'
  }
];

export const mockFlowChartNodes: FlowChartNode[] = [
  {
    id: '1',
    label: 'UserService',
    type: 'service',
    position: { x: 100, y: 100 },
    dependencies: ['DatabaseService', 'AuthService'],
    complexity: 7,
    description: 'Handles user management operations'
  },
  {
    id: '2',
    label: 'AuthService',
    type: 'service',
    position: { x: 300, y: 100 },
    dependencies: ['TokenService', 'DatabaseService'],
    complexity: 5,
    description: 'Manages authentication and authorization'
  },
  {
    id: '3',
    label: 'DatabaseService',
    type: 'service',
    position: { x: 200, y: 250 },
    dependencies: [],
    complexity: 3,
    description: 'Database connection and query handling'
  },
  {
    id: '4',
    label: 'TokenService',
    type: 'service',
    position: { x: 450, y: 200 },
    dependencies: [],
    complexity: 2,
    description: 'JWT token generation and validation'
  },
  {
    id: '5',
    label: 'UserController',
    type: 'class',
    position: { x: 100, y: 50 },
    dependencies: ['UserService'],
    complexity: 4,
    description: 'HTTP endpoints for user operations'
  }
];

export const mockQualityMetrics: QualityMetric[] = [
  {
    name: 'Code Coverage',
    value: 87,
    max: 100,
    status: 'good',
    description: 'Percentage of code covered by tests'
  },
  {
    name: 'Cyclomatic Complexity',
    value: 6.2,
    max: 10,
    status: 'good',
    description: 'Average complexity of functions'
  },
  {
    name: 'Technical Debt',
    value: 23,
    max: 50,
    status: 'warning',
    description: 'Hours of estimated technical debt'
  },
  {
    name: 'Maintainability Index',
    value: 78,
    max: 100,
    status: 'good',
    description: 'Overall maintainability score'
  },
  {
    name: 'Duplication',
    value: 12,
    max: 20,
    status: 'warning',
    description: 'Percentage of duplicated code'
  }
];

export const mockFileAnalysis: FileAnalysis[] = [
  {
    id: '1',
    fileId: '3',
    complexity: 7.2,
    maintainability: 78,
    testCoverage: 85,
    dependencies: ['react', '@types/react', 'lucide-react'],
    issues: [
      {
        id: '1',
        type: 'warning',
        severity: 'medium',
        message: 'Function complexity exceeds recommended threshold',
        line: 45,
        column: 12,
        rule: 'complexity'
      },
      {
        id: '2',
        type: 'info',
        severity: 'low',
        message: 'Consider extracting this component',
        line: 78,
        column: 8,
        rule: 'extract-component'
      }
    ],
    lastAnalyzed: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    fileId: '4',
    complexity: 4.1,
    maintainability: 92,
    testCoverage: 95,
    dependencies: ['react', 'react-router-dom'],
    issues: [],
    lastAnalyzed: '2024-01-14T16:20:00Z'
  }
];

export const mockGitInfo: Record<string, GitInfo> = {
  '3': {
    branch: 'feature/header-redesign',
    lastCommit: 'feat: update header styling',
    author: 'John Doe',
    status: 'modified'
  },
  '4': {
    branch: 'main',
    lastCommit: 'fix: navigation accessibility',
    author: 'Jane Smith',
    status: 'clean'
  }
}