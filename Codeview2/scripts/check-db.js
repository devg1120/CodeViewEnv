#!/usr/bin/env node

// Script to check database content
import { Database } from 'bun:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../backend/data/codebase.db');
const db = new Database(dbPath);

console.log('Projects in database:');
const projects = db.prepare('SELECT * FROM projects').all();
console.log(JSON.stringify(projects, null, 2));

console.log('\nFile nodes count:');
const fileCount = db.prepare('SELECT COUNT(*) as count FROM file_nodes').get();
console.log(fileCount.count);

db.close();