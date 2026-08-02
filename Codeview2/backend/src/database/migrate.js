import { initDatabase } from './init.js';

console.log('Initializing database...');
const db = initDatabase();
console.log('Database initialized successfully!');

// Test the database
const testQuery = db.prepare('SELECT COUNT(*) as count FROM projects').get();
console.log(`Database is working. Projects table has ${testQuery.count} records.`);

db.close();