import { useState, useEffect } from 'react';
import { BarChart3, FileText, Folder, AlertTriangle, CheckCircle, Clock, Loader2, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useProject } from '../contexts/ProjectContext';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { setSelectedProject, projects, setProjects } = useProject();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScanForm, setShowScanForm] = useState(false);
  const [scanData, setScanData] = useState({ path: '', name: '', description: '' });
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProjects();
      setProjects(response.projects);
      setError(null);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.scanRepository(
        scanData.path,
        scanData.name,
        scanData.description
      );
      console.log('Scan started:', response);
      setShowScanForm(false);
      setScanData({ path: '', name: '', description: '' });
      // Refresh projects after starting scan
      setTimeout(() => fetchProjects(), 1000);
    } catch (err) {
      setError('Failed to start repository scan');
      console.error('Error scanning repository:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will remove all associated data.')) {
      return;
    }

    try {
      setDeletingProjectId(projectId);
      await apiClient.deleteProject(projectId);
      // Remove project from state
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      setError('Failed to delete project');
      console.error('Error deleting project:', err);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const totalProjects = projects.length;
  const avgQualityScore = totalProjects > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / totalProjects)
    : 0;
  const totalFiles = projects.reduce((sum, p) => sum + (p.files || 0), 0);
  const totalLOC = projects.reduce((sum, p) => sum + (p.linesOfCode || 0), 0);

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
            onClick={fetchProjects}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Overview of your codebase analysis and quality metrics</p>
          </div>
          <button
            onClick={() => setShowScanForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Scan Repository
          </button>
        </div>
      </div>

      {/* Scan Repository Form Modal */}
      {showScanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan Repository</h2>
            <form onSubmit={handleScanSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository Path
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const path = files[0].webkitRelativePath || files[0].name;
                          const folderPath = path.split('/')[0];
                          setScanData({...scanData, path: folderPath});
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      // @ts-ignore - webkitdirectory is not in the types but works in modern browsers
                      webkitdirectory=""
                      directory=""
                      multiple
                    />
                    <input
                      type="text"
                      value={scanData.path}
                      onChange={(e) => setScanData({...scanData, path: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Or type the path manually"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Select a folder using the button above or type the full path manually
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={scanData.name}
                    onChange={(e) => setScanData({...scanData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="My Project"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={scanData.description}
                    onChange={(e) => setScanData({...scanData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Description of your project"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowScanForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Start Scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{totalProjects}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Folder className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Quality Score</p>
              <p className="text-3xl font-bold text-gray-900">{avgQualityScore}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-3xl font-bold text-gray-900">{totalFiles.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lines of Code</p>
              <p className="text-3xl font-bold text-gray-900">{(totalLOC / 1000).toFixed(0)}K</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 border-2 border-transparent"
                  onClick={() => {
                    setSelectedProject(project);
                    onNavigate('explorer');
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        View Wiki →
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{project.path}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{project.language || 'Unknown'}</span>
                      <span>{(project.files || 0)} files</span>
                      <span>{((project.linesOfCode || 0) / 1000).toFixed(1)}K LOC</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (project.qualityScore || 0) >= 90 ? 'bg-green-100 text-green-800' :
                      (project.qualityScore || 0) >= 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(project.qualityScore || 0)}%
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      disabled={deletingProjectId === project.id}
                      className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingProjectId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quality Metrics</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900">Code Coverage</span>
                  </div>
                  <span className="text-sm text-gray-600">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: '87%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Percentage of code covered by tests</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900">Cyclomatic Complexity</span>
                  </div>
                  <span className="text-sm text-gray-600">6.2/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: '62%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Average complexity of functions</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-gray-900">Technical Debt</span>
                  </div>
                  <span className="text-sm text-gray-600">23 hrs</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-yellow-500" style={{ width: '46%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Hours of estimated technical debt</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900">Maintainability Index</span>
                  </div>
                  <span className="text-sm text-gray-600">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: '78%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Overall maintainability score</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}