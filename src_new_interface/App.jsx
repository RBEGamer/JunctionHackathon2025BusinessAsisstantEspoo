import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import DashboardRoadmap from './components/DashboardRoadmap'
import StationDetail from './components/StationDetail'
import SubmissionsReview from './components/SubmissionsReview'
import AnsweredSummary from './components/AnsweredSummary'
import { stations } from './data/stations'

const createInitialProgressData = () => stations.map(s => ({
  id: s.id,
  subpoints: s.subpoints.map(sp => ({ ...sp })),
}));

const determineBasePath = () => {
  if (typeof window === 'undefined') {
    return '/'
  }

  const isGithubPages = window.location.hostname.endsWith('github.io')
  if (!isGithubPages) {
    return '/'
  }

  const pathSegments = window.location.pathname.split('/').filter(Boolean)
  const repoSegment = pathSegments[0]
  return repoSegment ? `/${repoSegment}` : '/'
}

function App() {
  const basePath = determineBasePath()
  const [progressData, setProgressData] = useState(() => {
    const saved = localStorage.getItem('entrepreneur-progress');
    if (saved) {
      return JSON.parse(saved);
    }
    return createInitialProgressData();
  });
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    localStorage.setItem('entrepreneur-progress', JSON.stringify(progressData));
  }, [progressData]);

  const updateSubpoint = (stationId, subpointId, completed) => {
    setProgressData(prev => prev.map(station => {
      if (station.id === stationId) {
        return {
          ...station,
          subpoints: station.subpoints.map(sp =>
            sp.id === subpointId ? { ...sp, completed } : sp
          ),
        };
      }
      return station;
    }));
  };

  const markStationComplete = (stationId) => {
    setProgressData(prev => prev.map(station => {
      if (station.id === stationId) {
        return {
          ...station,
          subpoints: station.subpoints.map(sp => ({ ...sp, completed: true })),
        };
      }
      return station;
    }));
  };

  const handleResetEntries = () => {
    localStorage.removeItem('track_answers');
    localStorage.removeItem('entrepreneur-progress');
    setProgressData(createInitialProgressData());
    setResetSignal(prev => prev + 1);
  };

  const getStationWithProgress = (stationId) => {
    const station = stations.find(s => s.id === stationId);
    const progress = progressData.find(p => p.id === stationId);
    if (!station) return null;
    
    return {
      ...station,
      subpoints: station.subpoints.map(sp => {
        const progressSp = progress?.subpoints.find(p => p.id === sp.id);
        return { ...sp, completed: progressSp?.completed || false };
      }),
    };
  };

  return (
    <Router basename={basePath}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Business Asisstant Espoo
                </Link>
                <div className="flex space-x-4">
                
                </div>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleResetEntries}
                  className="px-3 py-2 rounded-md text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors"
                >
                  Reset Track Entries
                </button>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <DashboardRoadmap
                progressData={progressData}
                getStationWithProgress={getStationWithProgress}
                resetSignal={resetSignal}
              />
            }
          />
          <Route
            path="/station/:stationId"
            element={
              <StationDetail
                getStationWithProgress={getStationWithProgress}
                updateSubpoint={updateSubpoint}
                markStationComplete={markStationComplete}
              />
            }
          />
          <Route
            path="/review"
            element={<SubmissionsReview />}
          />
          <Route
            path="/answers"
            element={<AnsweredSummary />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
