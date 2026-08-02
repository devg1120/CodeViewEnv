import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Search, List, Grid, Filter, Play, Download, CheckSquare, Square, Loader2, FileText, Maximize2, Copy, Check } from 'lucide-react';
import { apiClient } from '../lib/api';
import { FileNode } from '../types';
import { useProject } from '../contexts/ProjectContext';

export function FileExplorer() {
  const { selectedProject } = useProject();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'modified' | 'issues'>('all');
  const [searchField, setSearchField] = useState<'name' | 'path' | 'extension' | 'language'>('name');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [groupByDirectory, setGroupByDirectory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentViewMode, setContentViewMode] = useState<'raw' | 'documentation'>('raw');
  const [showFullDocument, setShowFullDocument] = useState(false);
  const [copySuccess, setCopySuccess] = useState<'raw' | 'doc' | null>(null);

  // Load file tree when a project is selected
  useEffect(() => {
    if (selectedProject) {
      loadFileTree(selectedProject.id);
    } else {
      setFileTree([]);
    }
  }, [selectedProject]);

  const loadFileTree = async (projectId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getProjectFileTree(projectId);
      setFileTree(response.tree);
      
      // Expand the root node by default
      if (response.tree.length > 0) {
        setExpandedNodes(new Set([response.tree[0].id]));
      }
    } catch (err) {
      setError('Failed to load file tree');
      console.error('Error loading file tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (fileId: string) => {
    if (!selectedProject) return;
    
    try {
      setContentLoading(true);
      const response = await apiClient.getFileContent(fileId);
      setFileContent(response.content);
    } catch (err) {
      console.error('Error loading file content:', err);
      setFileContent('Error loading file content');
    } finally {
      setContentLoading(false);
    }
  };

  // Load content when file selection changes
  useEffect(() => {
    if (selectedFile && selectedFile.type === 'file') {
      setFileContent(null);
      
      loadFileContent(selectedFile.id);
    }
  }, [selectedFile, contentViewMode]);

  const copyToClipboard = async (content: string, type: 'raw' | 'doc') => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const parseMarkdown = (text: string) => {
    if (!text) return '';
    
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
      
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-gray-800">$2</code></pre>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">$1</code>')
      
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:text-indigo-800 underline">$1</a>')
      
      // Lists
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc list-inside text-gray-700 mb-1">$1</li>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc list-inside text-gray-700 mb-1">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal list-inside text-gray-700 mb-1">$1</li>')
      
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="text-gray-700 mb-3">')
      .replace(/^(?!<[h|l|p|c])(.+$)/gim, '<p class="text-gray-700 mb-3">$1</p>')
      
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'directory') {
      return expandedNodes.has(node.id) ? FolderOpen : Folder;
    }
    return File;
  };

  const getFileColor = (extension?: string) => {
    switch (extension) {
      case 'tsx':
      case 'ts':
        return 'text-blue-600';
      case 'js':
      case 'jsx':
        return 'text-yellow-600';
      case 'css':
        return 'text-pink-600';
      case 'html':
        return 'text-orange-600';
      case 'json':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const filterNodes = (nodes: FileNode[], term: string): FileNode[] => {
    if (!term) return nodes;
    
    return nodes.filter(node => {
      let matches = false;
      const searchTerm = term.toLowerCase();
      
      switch (searchField) {
        case 'name':
          matches = node.name.toLowerCase().includes(searchTerm);
          break;
        case 'path':
          matches = node.path.toLowerCase().includes(searchTerm);
          break;
        case 'extension':
          matches = node.extension?.toLowerCase().includes(searchTerm) || false;
          break;
        case 'language':
          matches = node.language?.toLowerCase().includes(searchTerm) || false;
          break;
        default:
          matches = node.name.toLowerCase().includes(searchTerm);
      }
      
      const hasMatchingChildren = node.children && filterNodes(node.children, term).length > 0;
      return matches || hasMatchingChildren;
    }).map(node => ({
      ...node,
      children: node.children ? filterNodes(node.children, term) : undefined
    }));
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const Icon = getFileIcon(node);
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center space-x-2 py-1 px-2 hover:bg-gray-100 cursor-pointer rounded ${
            selectedFile?.id === node.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleNode(node.id);
            } else {
              setSelectedFile(node);
            }
          }}
        >
          {hasChildren && (
            <button className="p-0.5 hover:bg-gray-200 rounded">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <Icon className={`w-4 h-4 ${node.type === 'directory' ? 'text-blue-500' : getFileColor(node.extension)}`} />
          <span className="text-sm text-gray-900 flex-1">{node.name}</span>
          
          {node.type === 'file' && node.size && (
            <span className="text-xs text-gray-500">{formatFileSize(node.size)}</span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = filterNodes(fileTree, searchTerm);

  const flattenNodes = (nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = [];
    const traverse = (nodeList: FileNode[]) => {
      nodeList.forEach(node => {
        if (node.type === 'file') {
          result.push(node);
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return result;
  };

  const flatFiles = flattenNodes(filteredTree);
  const filteredFiles = flatFiles.filter(() => {
    if (filterStatus === 'all') return true;
    // We would implement actual filtering based on git status and issues here
    return true;
  });

  const groupFilesByDirectory = (files: FileNode[]) => {
    const grouped: { [directory: string]: FileNode[] } = {};
    
    files.forEach(fileItem => {
      const directory = fileItem.path.substring(0, fileItem.path.lastIndexOf('/')) || '/';
      if (!grouped[directory]) {
        grouped[directory] = [];
      }
      grouped[directory].push(fileItem);
    });
    
    return grouped;
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleAllFiles = (files: FileNode[]) => {
    const fileIds = files.map(f => f.id);
    const allSelected = fileIds.every(id => selectedFiles.has(id));
    
    const newSelected = new Set(selectedFiles);
    if (allSelected) {
      fileIds.forEach(id => newSelected.delete(id));
    } else {
      fileIds.forEach(id => newSelected.add(id));
    }
    setSelectedFiles(newSelected);
  };

  const executeBulkAction = async (actionId: string) => {
    if (!selectedProject) return;
    
    const selectedFileNodes = flatFiles.filter(f => selectedFiles.has(f.id));
    
    try {
      switch (actionId) {
        case 'analyze':
          // In a real implementation, this would trigger analysis for selected files
          console.log('Analyzing files:', selectedFileNodes.map(f => f.name));
          break;
        case 'copy-path': {
          const paths = selectedFileNodes.map(f => f.path).join('\n');
          navigator.clipboard.writeText(paths);
          break;
        }
        default:
          console.log(`Executing action ${actionId} on files:`, selectedFileNodes.map(f => f.name));
      }
      
      // Clear selection after action
      setSelectedFiles(new Set());
    } catch (err) {
      setError('Failed to execute bulk action');
      console.error('Error executing bulk action:', err);
    }
  };

  

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => selectedProject && loadFileTree(selectedProject.id)}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">File Explorer</h1>
          <p className="text-gray-600 mt-2">Browse and explore your project structure</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Please select a project from the dropdown in the header to explore its files</p>
        </div>
      </div>
    );
  }

  // Full Document Modal Component
  if (showFullDocument && selectedFile) {
    const content = fileContent; // Use file content for both raw and documentation modes
    const title = selectedFile.name;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">
                {contentViewMode === 'raw' ? 'Source Code' : 'Auto-generated Documentation'}
              </p>
            </div>
            <button
              onClick={() => setShowFullDocument(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-6 relative">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => content && copyToClipboard(content, contentViewMode === 'raw' ? 'raw' : 'doc')}
                className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
                disabled={!content}
              >
                {copySuccess === (contentViewMode === 'raw' ? 'raw' : 'doc') ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>

            {contentLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : content ? (
              <div className={contentViewMode === 'raw' ? 'font-mono text-sm' : 'max-w-none'}>
                {contentViewMode === 'raw' ? (
                  <pre className="whitespace-pre-wrap break-words text-gray-800 pr-20">
                    {content}
                  </pre>
                ) : (
                  <div 
                    className="prose prose-lg max-w-none pr-20"
                    dangerouslySetInnerHTML={{ 
                      __html: parseMarkdown(content)
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No content available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">File Explorer</h1>
        <p className="text-gray-600 mt-2">Browse and explore your project structure</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="name">File Name</option>
                <option value="path">File Path</option>
                <option value="extension">Extension</option>
                <option value="language">Language</option>
              </select>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[200px]"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Files</option>
                <option value="modified">Modified</option>
                <option value="issues">With Issues</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showAnalysis}
                onChange={(e) => setShowAnalysis(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Show Analysis</span>
            </label>
            
            {viewMode === 'table' && (
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={groupByDirectory}
                  onChange={(e) => setGroupByDirectory(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Group by Directory</span>
              </label>
            )}
            
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1 text-sm ${
                  viewMode === 'tree' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm ${
                  viewMode === 'table' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedFiles.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-900">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => executeBulkAction('analyze')}
                className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100 border"
              >
                Run Analysis
              </button>
              <button
                onClick={() => executeBulkAction('copy-path')}
                className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100 border"
              >
                Copy Paths
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'tree' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Tree */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Project Structure</h3>
            </div>
            
            <div className="p-2 max-h-96 overflow-y-auto">
              {filteredTree.map(node => renderNode(node))}
            </div>
          </div>
        </div>

        {/* File Details */}
        <div className="lg:col-span-2">
          {selectedFile ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <File className={`w-6 h-6 ${getFileColor(selectedFile.extension)}`} />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedFile.name}</h2>
                    <p className="text-sm text-gray-600">{selectedFile.path}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">File Information</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Size:</dt>
                        <dd className="text-sm text-gray-900">{formatFileSize(selectedFile.size)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Extension:</dt>
                        <dd className="text-sm text-gray-900">{selectedFile.extension || 'None'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Language:</dt>
                        <dd className="text-sm text-gray-900">{selectedFile.language || 'Unknown'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Last Modified:</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(selectedFile.lastModified).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <button 
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onClick={async () => {
                          if (selectedFile.id) {
                            try {
                              const response = await apiClient.getFileContent(selectedFile.id);
                              console.log('File content:', response.content);
                            } catch (err) {
                              console.error('Error getting file content:', err);
                            }
                          }
                        }}
                      >
                        View Content
                      </button>
                      <button 
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onClick={async () => {
                          if (selectedFile.id) {
                            try {
                              const response = await apiClient.analyzeFile(selectedFile.id);
                              console.log('Analysis result:', response);
                            } catch (err) {
                              console.error('Error analyzing file:', err);
                            }
                          }
                        }}
                      >
                        Run Analysis
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                        View Dependencies
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                        Show History
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Content Viewer</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setContentViewMode('raw')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            contentViewMode === 'raw'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Raw
                        </button>
                        <button
                          onClick={() => setContentViewMode('documentation')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            contentViewMode === 'documentation'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Docs
                        </button>
                      </div>
                      
                      <button
                        onClick={() => setShowFullDocument(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Full View</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded border min-h-[300px] max-h-[600px] overflow-auto">
                    {contentLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                      </div>
                    ) : contentViewMode === 'raw' ? (
                      <div className="relative">
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={() => fileContent && copyToClipboard(fileContent, 'raw')}
                            className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg shadow-sm transition-colors flex items-center space-x-1"
                            disabled={!fileContent}
                          >
                            {copySuccess === 'raw' ? (
                              <>
                                <Check className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-600">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 pt-12">
                          {fileContent ? (
                            <pre className="font-mono text-xs text-gray-800 whitespace-pre-wrap break-words">
                              {fileContent}
                            </pre>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No content available
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={() => fileContent && copyToClipboard(fileContent, 'doc')}
                            className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg shadow-sm transition-colors flex items-center space-x-1"
                            disabled={!fileContent}
                          >
                            {copySuccess === 'doc' ? (
                              <>
                                <Check className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-600">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 pt-12">
                          {fileContent ? (
                            <div className="max-w-none">
                              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-gray-200">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                <div>
                                  <h3 className="font-semibold text-gray-900">{selectedFile.name}</h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                      Markdown
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                      {selectedFile.extension?.toUpperCase() || 'File'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ 
                                  __html: parseMarkdown(fileContent)
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No content available for this file
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a file</h3>
              <p className="text-gray-600">Choose a file from the tree to view its details and content</p>
            </div>
          )}
        </div>
        </div>
      ) : (
        /* Table View */
        <div className="space-y-6">
          {groupByDirectory ? (
            // Directory-grouped view
            Object.entries(groupFilesByDirectory(filteredFiles)).map(([directory, files]) => (
              <div key={directory} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Folder className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-900">{directory}</span>
                      <span className="text-sm text-gray-500">({files.length} files)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAllFiles(files)}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        {files.every(f => selectedFiles.has(f.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleAllFiles(files)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {files.every(f => selectedFiles.has(f.id)) ? 
                                <CheckSquare className="w-4 h-4" /> : 
                                <Square className="w-4 h-4" />
                              }
                            </button>
                            <span>File</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Modified
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {files.map((file) => {
                        const isSelected = selectedFiles.has(file.id);
                        
                        return (
                          <tr
                            key={file.id}
                            className={`hover:bg-gray-50 ${
                              selectedFile?.id === file.id ? 'bg-indigo-50' : ''
                            } ${isSelected ? 'bg-blue-50' : ''}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFileSelection(file.id);
                                  }}
                                  className="mr-3 text-gray-400 hover:text-gray-600"
                                >
                                  {isSelected ? 
                                    <CheckSquare className="w-4 h-4 text-indigo-600" /> : 
                                    <Square className="w-4 h-4" />
                                  }
                                </button>
                                <File className={`w-4 h-4 mr-3 ${getFileColor(file.extension)}`} />
                                <div
                                  onClick={() => setSelectedFile(file)}
                                  className="cursor-pointer"
                                >
                                  <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                  <div className="text-sm text-gray-500">{file.extension?.toUpperCase()} • {file.language}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatFileSize(file.size)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(file.lastModified).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => console.log('Analyze file:', file.name)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                  title="Run Analysis"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => console.log('Download file:', file.name)}
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            // Flat table view
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleAllFiles(filteredFiles)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {filteredFiles.every(f => selectedFiles.has(f.id)) ? 
                              <CheckSquare className="w-4 h-4" /> : 
                              <Square className="w-4 h-4" />
                            }
                          </button>
                          <span>File</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modified
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFiles.map((file) => {
                      const isSelected = selectedFiles.has(file.id);
                      
                      return (
                        <tr
                          key={file.id}
                          className={`hover:bg-gray-50 ${
                            selectedFile?.id === file.id ? 'bg-indigo-50' : ''
                          } ${isSelected ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFileSelection(file.id);
                                }}
                                className="mr-3 text-gray-400 hover:text-gray-600"
                              >
                                {isSelected ? 
                                  <CheckSquare className="w-4 h-4 text-indigo-600" /> : 
                                  <Square className="w-4 h-4" />
                                }
                              </button>
                              <File className={`w-4 h-4 mr-3 ${getFileColor(file.extension)}`} />
                              <div
                                onClick={() => setSelectedFile(file)}
                                className="cursor-pointer"
                              >
                                <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                <div className="text-sm text-gray-500">{file.path}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(file.lastModified).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => console.log('Analyze file:', file.name)}
                                className="text-indigo-600 hover:text-indigo-800"
                                title="Run Analysis"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => console.log('Download file:', file.name)}
                                className="text-gray-600 hover:text-gray-800"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredFiles.length === 0 && (
                <div className="text-center py-12">
                  <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                  <p className="text-gray-600">Try adjusting your search terms or filters</p>
                </div>
              )}
            </div>
          )}
          
          {filteredFiles.length === 0 && groupByDirectory && (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}