# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack codebase analyzer application with a React TypeScript frontend and Node.js Fastify backend:

- **Frontend** (`/src`): React + TypeScript + Vite + Tailwind CSS application
- **Backend** (`/backend`): Fastify API server with SQLite database for code analysis

## Development Commands

### Frontend (Root Directory)
- `npm run dev` - Start Vite development server (usually on port 5173)
- `npm run build` - Build production frontend bundle
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

### Backend (`/backend` directory)
- `npm run dev` - Start backend with nodemon (auto-restart on changes)
- `npm start` - Start production backend server (port 3001)
- `npm run migrate` - Run database migrations

## Architecture Overview

### Frontend Architecture
- Single-page application with view-based routing via state management
- Main views: Dashboard, WikiView, FileExplorer, FlowChartView
- API communication through centralized ApiClient (`src/lib/api.ts`)
- Component structure follows atomic design with shared Layout and Navigation

### Backend Architecture
- Fastify web server with plugin-based route registration
- SQLite database with initialization and migration scripts
- Services layer: `codeAnalyzer.js` for static code analysis, `repositoryScanner.js` for file system operations
- Route modules: projects, files, analysis APIs

### API Communication
- Backend runs on `localhost:3001` with CORS enabled for frontend development
- RESTful API structure with `/api/v1` prefix
- Supports file uploads via multipart forms for repository scanning

### Code Analysis Features
- Static analysis calculating complexity, maintainability, test coverage estimates
- Language detection and dependency extraction
- Issue detection for code quality (line length, console.log, security patterns)
- Project-wide metrics aggregation

## Database
- SQLite database initialized via `backend/src/database/init.js`
- Migration support through `backend/src/database/migrate.js`
- Tables for projects, files, and analysis results

## Key Development Notes
- Frontend and backend must run simultaneously for full functionality
- Backend expects repository paths for scanning local codebases
- No existing test framework detected - verify test approach before adding tests