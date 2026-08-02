# CodeViewer Setup Guide

## Port Configuration (Avoids Common Conflicts)

**Frontend:**
- Development: `5170` (avoids Vite default 5173)
- Preview: `5171`

**Backend:**
- API: `7999` (avoids FastAPI 8000+ range)

## Quick Setup with Bun

```bash
# 1. Copy Bun configurations
cp package.bun.json package.json
cp backend/package.bun.json backend/package.json

# 2. Install dependencies
bun install

# 3. Initialize database
bun run migrate

# 4. Start development
bun run dev
```

## Manual Steps

1. **Convert backend to TypeScript:**
   ```bash
   cd backend/src
   mv server.js server.ts
   # Update package.json main field to server.ts
   ```

2. **Update ports in files:**
   - `backend/src/server.ts`: Change port to 7999
   - `src/lib/api.ts`: Update API_BASE_URL to http://localhost:7999
   - `vite.config.ts`: Set dev port to 5170, preview to 5171

3. **Update CORS in server.ts:**
   ```typescript
   origin: ['http://localhost:5170', 'http://localhost:5171']
   ```

## Current Issues to Fix

The errors you're seeing are because files are being auto-formatted while editing. The main changes needed:

1. **Port Updates** (to avoid conflicts with your Vite/FastAPI setup)
2. **Backend TypeScript Conversion** (for consistency)
3. **Root Directory Cleanup** (remove duplicate configs)

You can either:
- Run the setup commands above, or
- Manually make the port changes in the files mentioned