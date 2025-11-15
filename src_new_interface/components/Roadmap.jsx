import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ArrowRight, Lock } from 'lucide-react'
import { stations, calculateProgress, getAvailableStations } from '../data/stations'

function Roadmap({ progressData, getStationWithProgress }) {
  const completedStations = progressData
    .filter(p => p.subpoints.every(sp => sp.completed))
    .map(p => p.id);

  const availableStations = getAvailableStations(completedStations);
  const stationsWithProgress = stations.map(s => getStationWithProgress(s.id));

  // Organize stations by category for better visualization
  const stationsByCategory = stationsWithProgress.reduce((acc, station) => {
    if (!acc[station.category]) {
      acc[station.category] = [];
    }
    acc[station.category].push(station);
    return acc;
  }, {});

  const getCategoryColor = (category) => {
    const colors = {
      legal: 'from-red-500 to-red-600',
      planning: 'from-blue-500 to-blue-600',
      financial: 'from-green-500 to-green-600',
      preparation: 'from-purple-500 to-purple-600',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const getConnectionColor = (isCompleted, isAvailable) => {
    if (isCompleted) return 'bg-green-400';
    if (isAvailable) return 'bg-blue-400';
    return 'bg-gray-300';
  };

  // Create a visual roadmap with connections
  const renderStationNode = (station, index, total) => {
    const progress = calculateProgress(station);
    const isCompleted = progress === 100;
    const isAvailable = station.dependencies.every(dep => 
      completedStations.includes(dep)
    ) || station.dependencies.length === 0;
    const isLocked = !isAvailable && !isCompleted;

    return (
      <div key={station.id} className="flex flex-col items-center">
        {/* Connection Line */}
        {index < total - 1 && (
          <div className={`w-1 h-16 ${getConnectionColor(isCompleted, isAvailable)} mb-2`} />
        )}
        
        {/* Station Node */}
        <Link
          to={`/station/${station.id}`}
          className={`relative group ${
            isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all transform group-hover:scale-110 ${
              isCompleted
                ? 'bg-green-100 border-green-500'
                : isAvailable
                ? 'bg-blue-100 border-blue-500'
                : 'bg-gray-100 border-gray-400'
            }`}
          >
            {isLocked ? (
              <Lock className="w-10 h-10 text-gray-500" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            ) : (
              <Circle className="w-10 h-10 text-blue-600" />
            )}
          </div>
          
          {/* Progress Ring */}
          {!isCompleted && !isLocked && (
            <svg className="absolute inset-0 w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-blue-200"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                className="text-blue-500 transition-all duration-500"
              />
            </svg>
          )}
          
          {/* Progress Percentage */}
          {!isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700">{progress}%</span>
            </div>
          )}
        </Link>

        {/* Station Label */}
        <div className="mt-3 text-center max-w-[150px]">
          <h3 className={`text-sm font-semibold ${
            isCompleted ? 'text-green-700' : isAvailable ? 'text-blue-700' : 'text-gray-500'
          }`}>
            {station.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {station.subpoints.filter(sp => sp.completed).length}/{station.subpoints.length} tasks
          </p>
        </div>

        {/* Subpoints as branches */}
        <div className="mt-4 space-y-1">
          {station.subpoints.slice(0, 3).map((subpoint, spIdx) => (
            <div
              key={subpoint.id}
              className={`flex items-center text-xs ${
                subpoint.completed ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                subpoint.completed ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={subpoint.completed ? 'line-through' : ''}>
                {subpoint.label.length > 30 
                  ? subpoint.label.substring(0, 30) + '...' 
                  : subpoint.label}
              </span>
            </div>
          ))}
          {station.subpoints.length > 3 && (
            <div className="text-xs text-gray-400">
              +{station.subpoints.length - 3} more tasks
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Startup Roadmap</h1>
        <p className="text-lg text-gray-600">
          Visualize your journey through all the essential steps
        </p>
      </div>

      {/* Category-based Roadmap */}
      {Object.entries(stationsByCategory).map(([category, categoryStations]) => (
        <div key={category} className="mb-12">
          <div className={`inline-block px-4 py-2 rounded-lg mb-6 bg-gradient-to-r ${getCategoryColor(category)} text-white font-semibold capitalize`}>
            {category} Stations
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex flex-wrap justify-center items-start gap-8">
              {categoryStations.map((station, index) => 
                renderStationNode(station, index, categoryStations.length)
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Linear Roadmap View */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Complete Journey</h2>
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="flex flex-col items-center">
            {stationsWithProgress.map((station, index) => {
              const progress = calculateProgress(station);
              const isCompleted = progress === 100;
              const isAvailable = station.dependencies.every(dep => 
                completedStations.includes(dep)
              ) || station.dependencies.length === 0;
              const isLocked = !isAvailable && !isCompleted;

              return (
                <div key={station.id} className="flex items-center w-full mb-8 last:mb-0">
                  {/* Station Info */}
                  <div className="flex-1">
                    <Link
                      to={`/station/${station.id}`}
                      className={`block p-6 rounded-lg border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-50 border-green-300 hover:border-green-500'
                          : isAvailable
                          ? 'bg-blue-50 border-blue-300 hover:border-blue-500'
                          : 'bg-gray-50 border-gray-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {isLocked ? (
                            <Lock className="w-6 h-6 text-gray-400" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-blue-500" />
                          )}
                          <h3 className="text-lg font-semibold text-gray-800">{station.title}</h3>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{progress}%</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{station.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {station.subpoints.filter(sp => sp.completed).length} / {station.subpoints.length} tasks completed
                        </span>
                        {station.dependencies.length > 0 && (
                          <span className="text-yellow-600">
                            Requires: {station.dependencies.map(dep => {
                              const depStation = stations.find(s => s.id === dep);
                              return depStation?.title;
                            }).join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-green-500' : isAvailable ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </Link>
                  </div>

                  {/* Arrow */}
                  {index < stationsWithProgress.length - 1 && (
                    <div className="mx-4">
                      <ArrowRight className={`w-6 h-6 ${
                        isCompleted ? 'text-green-500' : isAvailable ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">Completed Station</span>
          </div>
          <div className="flex items-center gap-3">
            <Circle className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-700">Available Station</span>
          </div>
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-700">Locked (Complete dependencies first)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Roadmap;

