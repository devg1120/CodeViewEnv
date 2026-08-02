import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, FileText, User, Calendar, Tag, Loader2, Folder } from 'lucide-react';
import { WikiDocument } from '../types';
import { useProject } from '../contexts/ProjectContext';
import { apiClient } from '../lib/api';

export function WikiView() {
  const { selectedProject } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<WikiDocument | null>(null);
  const [wikiDocs, setWikiDocs] = useState<WikiDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wiki docs when project changes
  useEffect(() => {
    if (selectedProject) {
      loadWikiDocs(selectedProject.id);
    } else {
      setWikiDocs([]);
    }
  }, [selectedProject]);

  const loadWikiDocs = async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getProjectWiki(projectId);
      setWikiDocs(response.docs);
    } catch (err) {
      setError('Failed to load wiki documentation');
      console.error('Error loading wiki docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(wikiDocs.map(doc => doc.category)));
    return ['all', ...cats];
  }, [wikiDocs]);

  const types = useMemo(() => {
    const docTypes = Array.from(new Set(wikiDocs.map(doc => doc.type)));
    return ['all', ...docTypes];
  }, [wikiDocs]);

  const filteredDocuments = useMemo(() => {
    return wikiDocs.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesType = selectedType === 'all' || doc.type === selectedType;
      
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [wikiDocs, searchTerm, selectedCategory, selectedType]);

  if (selectedDocument) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => setSelectedDocument(null)}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to Wiki
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedDocument.title}</h1>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{selectedDocument.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedDocument.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span className="capitalize">{selectedDocument.type}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedDocument.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                {selectedDocument.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documentation Wiki</h1>
          <p className="text-gray-600 mt-2">Search and browse project documentation</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Please select a project from the dropdown to view its documentation</p>
        </div>
      </div>
    );
  }

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
            onClick={() => selectedProject && loadWikiDocs(selectedProject.id)}
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
        <h1 className="text-3xl font-bold text-gray-900">Documentation Wiki</h1>
        <p className="text-gray-600 mt-2">Auto-generated documentation for {selectedProject.name}</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setSelectedDocument(doc)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  doc.type === 'documentation' ? 'bg-blue-100 text-blue-800' :
                  doc.type === 'api' ? 'bg-green-100 text-green-800' :
                  doc.type === 'guide' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {doc.type}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {doc.content.substring(0, 150)}...
            </p>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {doc.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {doc.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  +{doc.tags.length - 3}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{doc.category}</span>
              <span>{new Date(doc.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && wikiDocs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documentation found</h3>
          <p className="text-gray-600">This project doesn't have any README files, API endpoints, or documentable components yet.</p>
        </div>
      )}
      
      {filteredDocuments.length === 0 && wikiDocs.length > 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching documents</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
}