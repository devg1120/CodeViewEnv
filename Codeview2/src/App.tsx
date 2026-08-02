import { useState } from 'react';
import { ProjectProvider } from './contexts/ProjectContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { FileExplorer } from './components/FileExplorer';
import { FlowChartView } from './components/FlowChartView';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveView} />;
      case 'explorer':
        return <FileExplorer />;
      case 'flowchart':
        return <FlowChartView />;
      default:
        return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation activeView={activeView} onViewChange={setActiveView} />
        <main className="pt-16">
          {renderView()}
        </main>
      </div>
    </ProjectProvider>
  );
}

export default App;
