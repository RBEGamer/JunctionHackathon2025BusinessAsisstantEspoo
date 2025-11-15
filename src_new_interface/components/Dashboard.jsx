import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { stations, calculateProgress, getOverallProgress, getAvailableStations } from '../data/stations'

function Dashboard({ progressData, getStationWithProgress }) {
  const completedStations = progressData
    .filter(p => p.subpoints.every(sp => sp.completed))
    .map(p => p.id);

  const availableStations = getAvailableStations(completedStations);
  const stationsWithProgress = stations.map(s => getStationWithProgress(s.id));

  const overallProgress = getOverallProgress(stationsWithProgress);

  const getCategoryColor = (category) => {
    const colors = {
      legal: 'bg-red-100 text-red-800 border-red-200',
      planning: 'bg-blue-100 text-blue-800 border-blue-200',
      financial: 'bg-green-100 text-green-800 border-green-200',
      preparation: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Entrepreneur Startup Guide
        </h1>
        <p className="text-lg text-gray-600">
          Track your progress through all the essential steps to start your business
        </p>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Overall Progress</h2>
          <span className="text-3xl font-bold text-blue-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(overallProgress)}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Available Stations */}
      {availableStations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Next Steps Available
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableStations.map(station => {
              const stationData = getStationWithProgress(station.id);
              const progress = calculateProgress(stationData);
              return (
                <Link
                  key={station.id}
                  to={`/station/${station.id}`}
                  className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-300 hover:border-blue-500 transition-all hover:shadow-xl transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{station.title}</h3>
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{station.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{progress}%</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All Stations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Stations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stationsWithProgress.map(station => {
            const progress = calculateProgress(station);
            const isCompleted = progress === 100;
            const isAvailable = station.dependencies.every(dep => 
              completedStations.includes(dep)
            ) || station.dependencies.length === 0;

            return (
              <Link
                key={station.id}
                to={`/station/${station.id}`}
                className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-xl transform hover:-translate-y-1 ${
                  isCompleted
                    ? 'border-green-300 hover:border-green-500'
                    : isAvailable
                    ? 'border-blue-300 hover:border-blue-500'
                    : 'border-gray-200 hover:border-gray-400 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-800">{station.title}</h3>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(station.category)}`}>
                      {station.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 mt-2">{station.description}</p>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-bold text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {station.subpoints.filter(sp => sp.completed).length} / {station.subpoints.length} tasks completed
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

