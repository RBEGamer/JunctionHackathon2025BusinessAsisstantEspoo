import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { stations, calculateProgress, getAvailableStations } from '../data/stations'
import FundingQuestionnaire from './FundingQuestionnaire'

function StationDetail({ getStationWithProgress, updateSubpoint, markStationComplete }) {
  const { stationId } = useParams()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  
  const userName = localStorage.getItem('user-name') || '';
  const station = getStationWithProgress(stationId)
  const pageSize = 3
  const stationSubpoints = station?.subpoints || []
  const totalPages = Math.max(1, Math.ceil(stationSubpoints.length / pageSize))
  const paginatedSubpoints = stationSubpoints.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [stationId])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if (!station) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Station not found</h2>
          <Link to="/" className="text-blue-600 hover:underline">Back to Your Roadmap</Link>
        </div>
      </div>
    )
  }

  const progress = calculateProgress(station)
  const allSubpoints = station.subpoints

  const handleToggleSubpoint = (subpointId) => {
    const subpoint = allSubpoints.find(sp => sp.id === subpointId)
    updateSubpoint(stationId, subpointId, !subpoint.completed)
  }

  // Conditional choices based on previous selections
  const getConditionalOptions = () => {
    const options = []
    
    // Language station - show language options
    if (stationId === 'language') {
      const languages = ['Chinese', 'English', 'Swedish', 'Finnish']
      return languages.map(lang => ({
        id: `lang-${lang.toLowerCase()}`,
        label: `Need ${lang} language services`,
        type: 'language',
      }))
    }
    
    // Tax/Legal station - show entity type options
    if (stationId === 'tax-legal') {
      return [
        { id: 'entity-sole', label: 'Sole Proprietorship', type: 'entity' },
        { id: 'entity-partnership', label: 'Partnership', type: 'entity' },
        { id: 'entity-llc', label: 'Limited Liability Company (LLC)', type: 'entity' },
        { id: 'entity-corporation', label: 'Corporation', type: 'entity' },
      ]
    }
    
    // Funding station - show funding options
    if (stationId === 'funding') {
      return [
        { id: 'funding-personal', label: 'Personal Savings', type: 'funding' },
        { id: 'funding-loan', label: 'Bank Loan', type: 'funding' },
        { id: 'funding-investor', label: 'Investor Funding', type: 'funding' },
        { id: 'funding-grant', label: 'Government Grant', type: 'funding' },
      ]
    }
    
    return []
  }

  const conditionalOptions = getConditionalOptions()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Your Roadmap
      </Link>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userName ? `${userName}, let's work on:` : 'Let\'s work on:'} {station.title}
          </h1>
          <p className="text-lg text-gray-600">
            {station.summary || station.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-xl font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tasks/Subpoints */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {userName ? `${userName}, here are your tasks:` : 'Here are your tasks:'}
          </h2>
          <div className="space-y-3">
            {paginatedSubpoints.map((subpoint) => (
              <div
                key={subpoint.id}
                className={`flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  subpoint.completed
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleToggleSubpoint(subpoint.id)}
              >
                <div className="flex-shrink-0 mr-4">
                  {subpoint.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    subpoint.completed ? 'text-green-800 line-through' : 'text-gray-800'
                  }`}>
                    {subpoint.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Conditional Options */}
                {conditionalOptions.length > 0 && (
                  <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Available Choices
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {conditionalOptions.map((option) => (
                <div
                  key={option.id}
                  className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition-all cursor-pointer"
                >
                  <p className="font-medium text-gray-800">{option.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies Warning */}
        {station.dependencies.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This station depends on completing: {' '}
              {station.dependencies.map((dep, idx) => {
                const depStation = stations.find(s => s.id === dep)
                return (
                  <span key={dep}>
                    {depStation?.title}
                    {idx < station.dependencies.length - 1 && ', '}
                  </span>
                )
              })}
            </p>
          </div>
        )}
      </div>

      {/* Funding Questionnaire */}
      {stationId === 'funding' && (
        <div className="mt-8">
          <FundingQuestionnaire
            onSubmit={(formData, report) => {
              markStationComplete(stationId)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default StationDetail
