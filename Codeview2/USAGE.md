# CodeViewer Usage Guide

## Getting Started

1. **Start the Application**:
   ```bash
   bun run dev
   ```
   This will start both the frontend (http://localhost:5200) and backend (http://localhost:7900) servers.

2. **Open the Dashboard**:
   Navigate to http://localhost:5200 in your browser to access the CodeViewer dashboard.

## Adding Repositories

### Using the Web Interface
1. Click the "Scan Repository" button in the Dashboard
2. Enter the path to your repository (e.g., `/home/user/my-project`)
3. Provide a name for the project (e.g., "My Project")
4. Add an optional description
5. Click "Start Scan"

The repository will be scanned in the background and will appear in your projects list once complete.

### Using the CLI Script
```bash
bun run scan
```
This will prompt you for the repository path, project name, and description.

## Viewing Code Analysis

### Dashboard
- View overall project metrics and quality scores
- See a list of all scanned repositories
- Access quick actions for each project

### File Explorer
- Browse repository file structure in tree or table view
- Search files by name, path, extension, or language
- View file details including size, language, and last modified date
- Run code analysis on individual files

### Code Analysis Features
- **Complexity Metrics**: Cyclomatic complexity scores
- **Maintainability**: Code quality scoring
- **Test Coverage**: Estimated test coverage percentage
- **Issue Detection**: Code smells and potential problems
- **LLM Analysis**: AI-powered code suggestions (when configured)

## Managing Projects

### Adding Projects
- Use the "Scan Repository" button in the Dashboard
- Or use the CLI: `bun run scan`

### Removing Projects
- Click the trash can icon next to any project in the Dashboard
- Confirm deletion when prompted

## LLM Analysis

### Testing LLM Functionality
```bash
bun run test-llm
```

### Configuring Real LLM APIs
1. Set the `OPENAI_API_KEY` environment variable
2. Uncomment and configure the OpenAI API call in `/backend/src/services/llm/codeAnalyzer.ts`

## Advanced Usage

### Direct API Access
You can interact with the CodeViewer API directly:

```bash
# Scan a repository
curl -X POST http://localhost:7900/api/v1/projects/scan \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "path": "/path/to/repository",
    "description": "Project description"
  }'

# Get project files
curl http://localhost:7900/api/v1/projects/{projectId}/files

# Analyze a file
curl -X POST http://localhost:7900/api/v1/files/{fileId}/analyze
```

## Troubleshooting

### CORS Errors
If you encounter CORS errors, ensure the backend is configured to allow requests from your frontend origin in `/backend/src/server.ts`.

### Repository Scanning Issues
- Ensure the repository path is accessible
- Check that the backend has proper file system permissions
- Verify Git is installed if analyzing Git repositories

### Performance with Large Repositories
For very large repositories, the initial scan may take some time. The application processes files in batches to manage memory usage.