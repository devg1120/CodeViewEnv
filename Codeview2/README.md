# CodeViewer - Desktop Codebase Analysis Tool

A comprehensive desktop application for analyzing codebases, providing quality metrics, documentation management, and architectural visualization. Built with Vite + React + TypeScript frontend and Fastify + SQLite backend, designed for future Tauri desktop packaging.

## Overview

CodeViewer helps developers understand and maintain codebases by providing:

- **Dashboard**: Overview metrics, project health scores, and recent activity
- **Wiki View**: Searchable documentation with filtering and categorization
- **File Explorer**: Interactive tree view and table view with advanced search and bulk operations
- **Flow Chart View**: Visual dependency mapping and architectural diagrams
- **Code Analysis**: Automated quality metrics, complexity scoring, and issue detection
- **MCP Integration**: Future Model Context Protocol server for AI-assisted code understanding

## Tech Stack

### Runtime & Package Manager
- **Bun** - Ultra-fast JavaScript runtime and package manager
- **Bun Workspaces** - Monorepo management for frontend/backend coordination

### Frontend
- **Vite** - Fast development with hot reload and optimized builds (via bunx)
- **React + TypeScript** - Component-based UI with strong type safety
- **Tailwind CSS** - Utility-first styling for consistent design
- **Lucide Icons** - Clean, consistent iconography

### Backend
- **Fastify** - High-performance web framework running on Bun
- **SQLite** - Lightweight, embedded database for local storage
- **Simple Git** - Git integration for repository analysis
- **Better SQLite3** - High-performance SQLite driver

### Future Integration
- **Tauri** - Desktop packaging for native performance and security
- **MCP Server** - Model Context Protocol for AI tool integration

## Architecture

### Frontend Structure
```
src/
├── components/         # React components
│   ├── Dashboard.tsx   # Project overview and metrics
│   ├── WikiView.tsx    # Documentation browser
│   ├── FileExplorer.tsx # File tree and table views
│   ├── FlowChartView.tsx # Dependency visualization
│   ├── Layout.tsx      # App shell and navigation
│   └── Navigation.tsx  # Main navigation component
├── lib/
│   ├── api.ts         # Backend API client
│   └── mockData.ts    # Development mock data
├── types/
│   └── index.ts       # TypeScript type definitions
└── App.tsx            # Main application component
```

### Backend Structure
```
backend/
├── src/
│   ├── database/       # Database schema and migrations
│   ├── routes/         # API endpoint handlers
│   ├── services/       # Business logic and analysis
│   └── utils/          # Helper functions
└── package.json        # Backend dependencies
```

### Database Schema
- **projects** - Repository metadata and scan results
- **files** - File structure and metadata
- **file_analysis** - Code quality metrics and issues
- **git_info** - Version control status and history

## Features

### Code Analysis
- **Complexity Metrics**: Cyclomatic complexity calculation
- **Maintainability Scoring**: File length, comments, line length analysis
- **Test Coverage Estimation**: Heuristic-based coverage scoring
- **Dependency Mapping**: Import and include relationship tracking
- **Issue Detection**: Code smells, security vulnerabilities, and style violations

### File Management
- **Tree View**: Hierarchical file browser with expand/collapse
- **Table View**: Sortable columns with detailed metadata
- **Directory Grouping**: Organized view by directory structure
- **Advanced Search**: Search by name, path, content, author, language, or tags
- **Bulk Operations**: Analyze, download, copy paths, or delete multiple files

### Documentation
- **Wiki System**: Searchable knowledge base with categorization
- **Faceted Search**: Filter by type, category, tags, and status
- **Document Types**: Support for various documentation formats
- **Metadata Management**: Tags, categories, and custom properties

### Visualization
- **Flow Charts**: Interactive dependency graphs with drag-and-drop
- **Node Filtering**: Filter by component type (service, class, module)
- **Zoom Controls**: Navigate large architectural diagrams
- **Connection Mapping**: Visual representation of code relationships

## Development

### Prerequisites
- **Bun** - Install from [bun.sh](https://bun.sh/): `curl -fsSL https://bun.sh/install | bash`
- **Git** - For repository analysis features

### Quick Start
```bash
# Clone and setup (one command!)
./dev.sh
```

### Manual Setup
1. **Install Bun Configuration**:
   ```bash
   # Copy Bun-optimized package.json files
   cp package.bun.json package.json
   cp backend/package.bun.json backend/package.json
   ```

2. **Install Dependencies**:
   ```bash
   # Install all workspace dependencies
   bun install
   cd backend && bun install
   ```

3. **Initialize Database**:
   ```bash
   bun run migrate
   ```

4. **Start Development (Both Frontend & Backend)**:
   ```bash
   bun run dev
   ```

### Available Scripts

#### Main Scripts (Root Directory)
- `bun run dev` - Start both frontend and backend in parallel
- `bun run dev:frontend` - Start Vite frontend only (port 5200)
- `bun run dev:backend` - Start Fastify backend only (port 7900)
- `bun run build` - Build frontend production bundle
- `bun run build:backend` - Build backend for production
- `bun run lint` - Run ESLint code quality checks
- `bun run migrate` - Initialize/update database
- `bun run start` - Start both production servers
- `bun run scan` - Scan a new repository using CLI prompt
- `bun run test-llm` - Test LLM analysis functionality

#### Backend Scripts (backend/ directory)
- `bun run dev` - Start backend with file watching
- `bun run start` - Start production backend server
- `bun run migrate` - Run database migrations
- `bun run build` - Build backend bundle for production

### API Usage

#### Scan Repository
```bash
curl -X POST http://localhost:7900/api/v1/projects/scan \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "path": "/path/to/repository",
    "description": "Project description"
  }'
```

#### Get Project Files
```bash
curl http://localhost:7900/api/v1/projects/{projectId}/files
```

#### Analyze File
```bash
curl -X POST http://localhost:7900/api/v1/files/{fileId}/analyze
```

## Integration

### Tauri Desktop App
To package as a desktop application:

1. **Add Tauri**:
   ```bash
   npm install -D @tauri-apps/cli
   npx tauri init
   ```

2. **Configure File System Access**:
   ```json
   // tauri.conf.json
   {
     "allowlist": {
       "fs": {
         "readDir": true,
         "readFile": true,
         "scope": ["**"]
       }
     }
   }
   ```

### MCP Server
For AI integration, implement Model Context Protocol:

```typescript
// Future MCP server endpoints
app.get('/mcp/tools', getMCPTools);
app.post('/mcp/call', callMCPTool);
app.get('/mcp/resources', getMCPResources);
```

## Quality Checks

The application includes built-in code quality analysis:
- Line length violations (>120 characters)
- Console.log detection in production code
- TODO/FIXME comment tracking
- Security vulnerability patterns (eval, innerHTML)
- Import/dependency analysis

## Contributing

1. Follow the existing code style (ESLint configuration)
2. Add TypeScript types for new features
3. Update mock data for UI development
4. Test with real repositories before committing
5. Maintain database schema migrations

## Future Roadmap

- **Tauri Integration**: Desktop packaging with native file system access
- **Advanced Analysis**: Integration with ESLint, TypeScript compiler API, and language servers
- **Git Integration**: Enhanced version control analysis and history tracking
- **MCP Server**: AI tool integration for automated code understanding
- **Plugin System**: Extensible analysis tools and custom metrics
- **Team Features**: Shared analysis results and collaborative documentation
- **Performance**: Incremental analysis and file watching for large codebases

## License

This project is designed for local development and codebase analysis. Adapt licensing as needed for your use case.