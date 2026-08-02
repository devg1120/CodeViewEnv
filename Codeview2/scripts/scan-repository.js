#!/usr/bin/env node

// Script to scan a repository and add it to the code viewer
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function scanRepository() {
  console.log('Repository Scanner for CodeViewer');
  console.log('==================================');
  
  rl.question('Enter the path to the repository: ', async (repoPath) => {
    rl.question('Enter a name for this project: ', async (projectName) => {
      rl.question('Enter a description (optional): ', async (description) => {
        try {
          console.log(`\nScanning repository: ${repoPath}`);
          
          const response = await fetch('http://localhost:7900/api/v1/projects/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              path: repoPath,
              name: projectName,
              description: description || ''
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            console.error('Scan failed:', error.error);
            rl.close();
            return;
          }
          
          const result = await response.json();
          console.log('Scan started successfully!');
          console.log(`Project ID: ${result.projectId}`);
          console.log(`Status: ${result.status}`);
          console.log('The repository will be scanned in the background.');
          
        } catch (error) {
          console.error('Error scanning repository:', error.message);
        } finally {
          rl.close();
        }
      });
    });
  });
}

scanRepository();