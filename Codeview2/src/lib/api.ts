import { Project, FileNode, FileAnalysis, LLMAnalysisResult } from '../types';

const API_BASE_URL = 'http://localhost:7900/api/v1';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(url)

    const response = await fetch(url, {
      //method: 'POST',  //GUSA
      //method: 'GET',     //GUSA
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    console.log("r",response)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Projects
  async getProjects(): Promise<{ projects: Project[] }> {
    return this.request('/projects');
  }

  async getProject(id: string): Promise<{ project: Project }> {
    return this.request(`/projects/${id}`);
  }

  async scanRepository(path: string, name: string, description?: string): Promise<{ projectId: string; message: string; status: string }> {
    return this.request('/projects/scan', {
      method: 'POST',
      body: JSON.stringify({ path, name, description }),
    });
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Files
  async getProjectFiles(
    projectId: string, 
    options: {
      search?: string;
      searchField?: string;
      filterStatus?: string;
    } = {}
  ): Promise<{ files: FileNode[] }> {
    const params = new URLSearchParams();
    if (options.search) params.append('search', options.search);
    if (options.searchField) params.append('searchField', options.searchField);
    if (options.filterStatus) params.append('filterStatus', options.filterStatus);
    
    const query = params.toString();
    return this.request(`/projects/${projectId}/files${query ? `?${query}` : ''}`);
  }

  async getProjectFileTree(projectId: string): Promise<{ tree: FileNode[] }> {
    return this.request(`/projects/${projectId}/tree`);
  }

  async getFileContent(fileId: string): Promise<{ content: string; file: FileNode }> {
    return this.request(`/files/${fileId}/content`);
  }

  async executeBulkAction(action: string, fileIds: string[]): Promise<{ results?: any[]; paths?: string[] }> {
    return this.request('/files/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, fileIds }),
    });
  }

  // Analysis
  async analyzeFile(fileId: string): Promise<{ analysis: FileAnalysis; analysisId: string }> {
    return this.request(`/files/${fileId}/analyze`, {
      method: 'POST',
    });
  }

  async analyzeFileWithLLM(fileId: string): Promise<{ analysis: LLMAnalysisResult }> {
    return this.request(`/files/${fileId}/llm-analyze`, {
      method: 'POST',
    });
  }

  async getFileAnalysis(fileId: string): Promise<{ analysis: FileAnalysis }> {
    return this.request(`/files/${fileId}/analysis`);
  }

  async getProjectMetrics(projectId: string): Promise<{ 
    metrics: {
      total_files: number;
      avg_complexity: number;
      avg_maintainability: number;
      avg_coverage: number;
      files_with_issues: number;
    };
    languageStats: Array<{
      language: string;
      count: number;
      total_size: number;
    }>;
  }> {
    return this.request(`/projects/${projectId}/metrics`);
  }

  // Wiki
  async getProjectWiki(projectId: string): Promise<{ docs: any[]; projectName: string }> {
    return this.request(`/projects/${projectId}/wiki`);
  }

  async getWikiDocument(projectId: string, docId: string): Promise<{ doc: any }> {
    return this.request(`/projects/${projectId}/wiki/${docId}`);
  }
}

export const apiClient = new ApiClient();
