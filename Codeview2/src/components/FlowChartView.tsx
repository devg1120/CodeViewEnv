import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Filter, GitBranch } from 'lucide-react';
import { mockFlowChartNodes } from '../lib/mockData';
import { FlowChartNode } from '../types';

export function FlowChartView() {
  const [selectedNode, setSelectedNode] = useState<FlowChartNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState('all');

  const nodeTypes = ['all', 'service', 'class', 'module', 'component', 'function'];

  const filteredNodes = mockFlowChartNodes.filter(node => 
    filterType === 'all' || node.type === filterType
  );

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'class': return 'bg-green-100 border-green-300 text-green-800';
      case 'module': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'component': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'function': return 'bg-pink-100 border-pink-300 text-pink-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 3) return 'text-green-600';
    if (complexity <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const drawConnections = () => {
    const connections: JSX.Element[] = [];
    
    filteredNodes.forEach(node => {
      node.dependencies.forEach(depId => {
        const depNode = filteredNodes.find(n => n.label === depId);
        if (depNode) {
          const startX = node.position.x + 100; // Assuming node width of 200px
          const startY = node.position.y + 40; // Assuming node height of 80px
          const endX = depNode.position.x;
          const endY = depNode.position.y + 40;
          
          connections.push(
            <line
              key={`${node.id}-${depNode.id}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#6B7280"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              className="opacity-60"
            />
          );
        }
      });
    });
    
    return connections;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Flow Charts</h1>
        <p className="text-gray-600 mt-2">Visualize code dependencies and architecture</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {nodeTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Flow Chart Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative bg-gray-50" style={{ height: '600px' }}>
              <svg
                width="100%"
                height="100%"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                className="absolute inset-0"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6B7280"
                    />
                  </marker>
                </defs>
                {drawConnections()}
              </svg>
              
              {filteredNodes.map(node => (
                <div
                  key={node.id}
                  className={`absolute cursor-pointer transform transition-transform hover:scale-105 ${
                    selectedNode?.id === node.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left'
                  }}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className={`w-48 p-4 rounded-lg border-2 shadow-sm ${getNodeColor(node.type)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <GitBranch className="w-4 h-4" />
                      <span className="font-medium text-sm">{node.label}</span>
                    </div>
                    <div className="text-xs opacity-75 mb-2">
                      {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Complexity:</span>
                      <span className={`font-medium ${getComplexityColor(node.complexity)}`}>
                        {node.complexity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Node Details */}
        <div className="lg:col-span-1">
          {selectedNode ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <GitBranch className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{selectedNode.label}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedNode.type}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Complexity</label>
                    <p className={`text-sm font-medium ${getComplexityColor(selectedNode.complexity)}`}>
                      {selectedNode.complexity}/10
                    </p>
                  </div>
                  
                  {selectedNode.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-sm text-gray-900">{selectedNode.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Dependencies</label>
                    {selectedNode.dependencies.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {selectedNode.dependencies.map((dep, index) => (
                          <li key={index} className="text-sm text-gray-900 flex items-center space-x-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span>{dep}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No dependencies</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                      View Source Code
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                      Analyze Dependencies
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                      Run Quality Check
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <GitBranch className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Select a Node</h3>
              <p className="text-sm text-gray-600">Click on a node to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}