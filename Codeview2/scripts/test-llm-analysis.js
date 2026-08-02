#!/usr/bin/env node

// Script to test LLM analysis functionality

// Simple test - analyze a sample file
async function testLLMAnalysis() {
  try {
    console.log('Testing LLM Analysis...');
    
    // Get the first project from the database
    const response = await fetch('http://localhost:7900/api/v1/projects');
    const projectsData = await response.json();
    
    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log('No projects found. Please scan a repository first.');
      return;
    }
    
    const projectId = projectsData.projects[0].id;
    console.log(`Using project: ${projectsData.projects[0].name}`);
    
    // Get files for this project
    const filesResponse = await fetch(`http://localhost:7900/api/v1/projects/${projectId}/files`);
    const filesData = await filesResponse.json();
    
    if (!filesData.files || filesData.files.length === 0) {
      console.log('No files found in project.');
      return;
    }
    
    // Find a JavaScript/TypeScript file to analyze
    const codeFile = filesData.files.find(f => 
      f.extension === 'js' || 
      f.extension === 'ts' || 
      f.extension === 'jsx' || 
      f.extension === 'tsx'
    );
    
    if (!codeFile) {
      console.log('No code files found to analyze.');
      return;
    }
    
    console.log(`Analyzing file: ${codeFile.name}`);
    
    // Call the LLM analysis endpoint
    const analysisResponse = await fetch(`http://localhost:7900/api/v1/files/${codeFile.id}/llm-analyze`, {
      method: 'POST'
    });
    
    if (!analysisResponse.ok) {
      console.error('Analysis failed:', await analysisResponse.text());
      return;
    }
    
    const analysisData = await analysisResponse.json();
    console.log('LLM Analysis Results:');
    console.log(JSON.stringify(analysisData, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testLLMAnalysis();