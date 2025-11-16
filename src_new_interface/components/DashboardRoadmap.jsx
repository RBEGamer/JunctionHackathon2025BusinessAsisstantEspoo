import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ArrowRight, Calendar, Target, Sparkles, Building2, Lightbulb, Edit2, Save, X, Lock, ClipboardList } from 'lucide-react'
import { stations, calculateProgress, getOverallProgress, getAvailableStations, canScheduleAppointment, REQUIRED_STATIONS_FOR_APPOINTMENT, isStationAvailable, hasCompletedFundingTrack } from '../data/stations'
import AppointmentScheduling from './AppointmentScheduling'
import AnsweredSummary from './AnsweredSummary'

const readStoredTrackAnswers = () => {
  try {
    return JSON.parse(localStorage.getItem('track_answers') || '{}');
  } catch (e) {
    return {};
  }
};

function DashboardRoadmap({ progressData, getStationWithProgress, resetSignal }) {
  const [activeTab, setActiveTab] = useState('info')
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('user-name') || '';
  });
  const [showNameInput, setShowNameInput] = useState(!userName);
  const [tempName, setTempName] = useState('');
  
  const [companyData, setCompanyData] = useState(() => {
    const saved = localStorage.getItem('company-data');
    return saved ? JSON.parse(saved) : {
      companyName: '',
      companyIdea: '',
      industry: '',
      contactEmail: '',
    };
  });
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempCompanyData, setTempCompanyData] = useState(companyData);

  const [trackAnswers, setTrackAnswers] = useState(readStoredTrackAnswers);

  const companyInfoValues = [
    companyData.companyName,
    companyData.industry,
    companyData.contactEmail,
    companyData.companyIdea,
  ];
  const hasCompanyInfoFilled = companyInfoValues.some(value =>
    typeof value === 'string' ? value.trim().length > 0 : !!value
  );
  const areOtherTabsLocked = !hasCompanyInfoFilled;
  const isTabLocked = (tabId) => {
    if (tabId === 'company' || tabId === 'info') return false;
    return areOtherTabsLocked;
  };
  useEffect(() => {
    if (!hasCompanyInfoFilled && activeTab !== 'company' && activeTab !== 'info') {
      setActiveTab('company');
    }
  }, [hasCompanyInfoFilled, activeTab]);

  useEffect(() => {
    if (!showWelcomeModal) {
      localStorage.setItem('espi-welcome-shown', 'true');
    }
  }, [showWelcomeModal]);


  const [selectedStationId, setSelectedStationId] = useState(null);
  const [stationPage, setStationPage] = useState(1);

  // First calculate stations with progress
  const stationsWithProgress = stations.map(s => getStationWithProgress(s.id));
  
  // Then determine completed stations based on progress (100% means completed)
  const completedStations = stationsWithProgress
    .filter(s => calculateProgress(s) === 100)
    .map(s => s.id);

  const hasFundingStarted = stationsWithProgress.some(s =>
    s.category === 'funding' && calculateProgress(s) > 0
  );
  const fundingTracks = !hasFundingStarted
    ? stationsWithProgress.filter(s => s.category === 'funding')
    : [];

  // Prepare timeline stations (include funding tracks only if fully completed)
  const timelineStations = stationsWithProgress.filter(s =>
    s.category !== 'funding' || calculateProgress(s) === 100
  );

  // Then calculate availability
  const availableStations = getAvailableStations(completedStations);
  const overallProgress = getOverallProgress(timelineStations);
  const canSchedule = canScheduleAppointment(completedStations);
  const nextPossibleTracks = [...fundingTracks]
    .map(track => ({
      track,
      isAvailable: isStationAvailable(track, completedStations),
      progress: calculateProgress(track),
    }))
    .sort((a, b) => {
      if (a.isAvailable === b.isAvailable) {
        return b.progress - a.progress;
      }
      return a.isAvailable ? -1 : 1;
    });
  const roadmapTabLocked = isTabLocked('roadmap');
  const answersTabLocked = isTabLocked('answers');
  const appointmentTabDisabled = isTabLocked('appointment') || !canSchedule;

  const renderStationButton = (station) => {
    const progress = calculateProgress(station);
    const isCompleted = progress === 100;
    const isAvailable = isStationAvailable(station, completedStations);
    const statusColor = isCompleted ? 'bg-green-600' : isAvailable ? 'bg-teal-600' : 'bg-gray-400';
    const locked = !isAvailable && !isCompleted;

    return (
      <div key={station.id} className="relative">
        <button
          onClick={() => { if (!locked) setSelectedStationId(station.id); }}
          disabled={locked}
          className={`flex items-start gap-3 w-full text-left ${locked ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          <div className="relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${statusColor}`}>{station.order}</div>
          </div>
          <div>
            <div className={`text-sm font-semibold ${selectedStationId === station.id ? 'text-teal-800' : 'text-gray-700'}`}>{station.title}</div>
            <div className="text-xs text-gray-500">{calculateProgress(station)}% complete</div>
          </div>
        </button>
      </div>
    );
  };

  const getMenuTabClass = (isActive, isDisabled) => {
    if (isActive) {
      return 'bg-teal-50 border-b-teal-600 text-teal-700';
    }
    if (isDisabled) {
      return 'bg-gray-50 border-b-gray-200 text-gray-400 opacity-60 cursor-not-allowed';
    }
    return 'bg-gray-50 border-b-gray-200 text-gray-600 hover:bg-gray-100';
  };

  // Set initial selectedStationId if not already set
  useEffect(() => {
    if (!selectedStationId) {
      setSelectedStationId(timelineStations[0]?.id || null);
    }
  }, [timelineStations, selectedStationId]);


  useEffect(() => {
    setStationPage(1)
  }, [selectedStationId])

  useEffect(() => {
    setTrackAnswers(readStoredTrackAnswers());
  }, [resetSignal]);

  useEffect(() => {
    try {
      localStorage.setItem('track_answers', JSON.stringify(trackAnswers));
    } catch (e) {
      console.warn('Failed to persist track answers', e);
    }
  }, [trackAnswers]);

  const handleAnswerChange = (key, value) => {
    setTrackAnswers(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('user-name', tempName.trim());
      setShowNameInput(false);
    }
  };

  const handleSaveCompanyData = () => {
    setCompanyData(tempCompanyData);
    localStorage.setItem('company-data', JSON.stringify(tempCompanyData));
    setIsEditingCompany(false);
  };

  const handleCancelEdit = () => {
    setTempCompanyData(companyData);
    setIsEditingCompany(false);
  };

  const handleScheduleAppointment = () => {
    // In a real app, this would open a calendar/scheduling interface
    // For now, we'll show an alert and save the appointment request
    const appointmentData = {
      timestamp: new Date().toISOString(),
      userName: userName || 'User',
      completedStations: completedStations,
      progress: overallProgress,
    };
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointmentData);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    alert(`Thank you${userName ? `, ${userName}` : ''}! Your appointment request has been submitted. A professional will contact you soon to schedule your consultation.`);
  };

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

  const getConnectionColor = (prevStation, currentStation) => {
    if (!prevStation) return 'bg-gray-300';
    
    const prevProgress = calculateProgress(prevStation);
    const prevCompleted = prevProgress === 100;
    const prevNotStarted = prevProgress === 0;
    
    if (prevCompleted) return 'bg-green-500';
    if (prevNotStarted) return 'bg-red-500';
    return 'bg-orange-500';
  };

  const requiredStationsProgress = stationsWithProgress
    .filter(s => REQUIRED_STATIONS_FOR_APPOINTMENT.includes(s.id))
    .map(s => ({ station: s, progress: calculateProgress(s) }));

  const requiredProgress = Math.round(
    requiredStationsProgress.reduce((sum, s) => sum + s.progress, 0) / 
    requiredStationsProgress.length
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Welcome to your Business Asisstant Espoo workflow</h2>
              <p className="text-sm text-gray-600">
                This roadmap walks you from basic company info through financial numbers,
                funding tracks, insurance, and final submission. Complete the Company Info
                tab first; we use it to unlock the other sections. Funding and submission
                stations only open when their prerequisites and eligibility answers are met.
              </p>
              <ul className="text-sm text-gray-700 space-y-2 pl-5 list-disc">
                <li>Fill out Company Info to unlock the roadmap and answers tabs.</li>
                <li>Complete tracks in order; next steps appear under “Next possible tracks”.</li>
                <li>When all required tracks reach 100%, the appointment button unlocks.</li>
              </ul>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="w-full mt-2 bg-[#0050bb] text-white rounded-lg py-2 font-semibold hover:bg-[#33d5e4]"
              >
                Got it, let’s start
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="py-8">
        {/* Tab Navigation */}
        <div className="mb-8 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="flex flex-wrap items-center">
            {/* Info Tab */}
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 border-b-4 ${getMenuTabClass(activeTab === 'info', false)}`}
            >
              <Sparkles className="w-5 h-5" />
              Info & Guide
            </button>

            {/* Company Info Tab */}
            <button
              onClick={() => setActiveTab('company')}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 border-b-4 ${getMenuTabClass(activeTab === 'company', false)}`}
            >
              <Building2 className="w-5 h-5" />
              Company Info
            </button>

            {/* Roadmap Tab */}
            <div className="relative flex-1 group">
              <button
                onClick={() => {
                  if (roadmapTabLocked) return;
                  setActiveTab('roadmap');
                }}
                disabled={roadmapTabLocked}
                className={`w-full flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 border-b-4 ${getMenuTabClass(activeTab === 'roadmap', roadmapTabLocked)}`}
              >
                <Target className="w-5 h-5" />
                Roadmap
              </button>
              {roadmapTabLocked && (
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 rounded-md bg-black/85 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  Fill in company info to unlock the roadmap.
                </div>
              )}
            </div>

            <div className="relative flex-1 group">
              <button
                onClick={() => {
                  if (answersTabLocked) return;
                  setActiveTab('answers');
                }}
                disabled={answersTabLocked}
                className={`w-full flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 border-b-4 ${getMenuTabClass(activeTab === 'answers', answersTabLocked)}`}
              >
                <ClipboardList className="w-5 h-5" />
                Submission
              </button>
              {answersTabLocked && (
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 rounded-md bg-black/85 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  Enter company info to view answers.
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (appointmentTabDisabled) return;
                setActiveTab('appointment');
              }}
              disabled={appointmentTabDisabled}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 border-b-4 ${getMenuTabClass(activeTab === 'appointment', appointmentTabDisabled)}`}
            >
              <Calendar className="w-5 h-5" />
              Appointment
            </button>

          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' ? (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-teal-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Welcome to Business Asisstant Espoo</h3>
                <p className="text-gray-600 mt-1">This short guide explains how to move from collecting company info to unlocking funding tracks and, finally, scheduling time with an advisor.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                <h4 className="font-semibold text-teal-800 mb-2">1. Start with Company Info</h4>
                <p className="text-sm text-teal-900">Fill in the Company Info tab so we can personalise the roadmap and unlock the rest of the experience. Everything is saved locally in your browser.</p>
                <ul className="mt-3 text-sm text-teal-900 space-y-1 list-disc pl-4">
                  <li>Company name &amp; industry</li>
                  <li>Contact email</li>
                  <li>Your idea description</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">2. Work through the roadmap</h4>
                <p className="text-sm text-blue-900">Tracks unlock once their prerequisites are completed. Each track contains clear questions and progress indicators.</p>
                <ul className="mt-3 text-sm text-blue-900 space-y-1 list-disc pl-4">
                  <li>Answer prompts (including Yes / No checkpoints)</li>
                  <li>Upload documents when asked</li>
                  <li>Mark sub-steps complete to reach 100%</li>
                </ul>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <h4 className="font-semibold text-purple-800 mb-2">3. Review your answers</h4>
                <p className="text-sm text-purple-900">Use the “Answered Questions” tab to see everything you have entered organised by track. Download or print it for offline reviews.</p>
                <p className="text-xs text-purple-700 mt-1">Before requesting an appointment, double-check these answers so you can discuss any gaps with the advisor.</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h4 className="font-semibold text-amber-800 mb-2">4. Book help when ready</h4>
                <p className="text-sm text-amber-900">Once the required tracks ({REQUIRED_STATIONS_FOR_APPOINTMENT.join(', ')}) are complete, the appointment tab unlocks so you can request time with an advisor.</p>
              </div>
            </div>
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-1">Need a refresher later?</h4>
              <p className="text-sm text-gray-600">You can always return to this Info tab. Progress is stored locally, so reloading the page keeps your data safe.</p>
            </div>
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-1">No cookies required</h4>
              <p className="text-sm text-gray-600">All answers stay inside your browser storage. Nothing is sent to a server until you explicitly submit or download, so you can explore freely.</p>
            </div>
          </div>
        ) : activeTab === 'company' ? (
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border-2 border-teal-200 mb-8">
            {!isEditingCompany ? (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-5 h-5 text-teal-600" />
                      <h3 className="font-bold text-gray-800 text-lg">Company Information</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      These details unlock the rest of the roadmap, personalise the next steps,
                      and pre-fill funding forms later on. We keep the information locally in your
                      browser so you can edit and revisit anytime.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {companyData.companyName && (
                      <div>
                        <span className="text-gray-600 font-medium">Company Name:</span>
                        <p className="text-gray-800 font-semibold">{companyData.companyName}</p>
                      </div>
                    )}
                    {companyData.industry && (
                      <div>
                        <span className="text-gray-600 font-medium">Industry:</span>
                        <p className="text-gray-800 font-semibold">{companyData.industry}</p>
                      </div>
                    )}
                    {companyData.contactEmail && (
                      <div>
                        <span className="text-gray-600 font-medium">Contact Email:</span>
                        <p className="text-gray-800 font-semibold">{companyData.contactEmail}</p>
                      </div>
                    )}
                    {companyData.companyIdea && (
                      <div className="md:col-span-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 font-medium">Company Idea:</span>
                            <p className="text-gray-800 font-semibold">{companyData.companyIdea}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!companyData.companyName && !companyData.industry && !companyData.contactEmail && !companyData.companyIdea && (
                      <p className="text-gray-500 italic md:col-span-2">No company information entered yet. Click edit to add details.</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingCompany(true)}
                  className="ml-4 p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                  title="Edit company information"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-gray-800">Edit Company Information</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveCompanyData}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Save"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={tempCompanyData.companyName}
                      onChange={(e) => setTempCompanyData({...tempCompanyData, companyName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={tempCompanyData.industry}
                      onChange={(e) => setTempCompanyData({...tempCompanyData, industry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Enter industry"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={tempCompanyData.contactEmail}
                      onChange={(e) => setTempCompanyData({...tempCompanyData, contactEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Enter contact email"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Idea</label>
                    <textarea
                      value={tempCompanyData.companyIdea}
                      onChange={(e) => setTempCompanyData({...tempCompanyData, companyIdea: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Describe your company idea..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'roadmap' ? (
          <>
      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Your Overall Progress</h2>
          <span className="text-3xl font-bold text-teal-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(overallProgress)}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {userName 
            ? `${userName}, you've completed ${timelineStations.filter(s => calculateProgress(s) === 100).length} of ${timelineStations.length} stations.`
            : `You've completed ${timelineStations.filter(s => calculateProgress(s) === 100).length} of ${timelineStations.length} stations.`}
        </p>
      </div>

      {/* Roadmap Visualization as Metro Timeline Sidebar + Single Action View */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Roadmap to Founding Your Business</h2>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar Metro Timeline */}
          <aside className="hidden lg:block">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Timeline</h3>
              <div className="relative pl-8">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  {timelineStations.map((station, idx) => {
                    const progress = calculateProgress(station);
                    const isCompleted = progress === 100;
                    const isAvailable = isStationAvailable(station, completedStations);
                    const statusColor = isCompleted ? 'bg-green-600' : isAvailable ? 'bg-teal-600' : 'bg-gray-400';
                    const locked = !isAvailable && !isCompleted;

                    return (
                      <div key={station.id} className="relative">
                        <button
                          onClick={() => { if (!locked) setSelectedStationId(station.id); }}
                          disabled={locked}
                          className={`flex items-start gap-3 w-full text-left ${locked ? 'cursor-not-allowed opacity-70' : ''}`}
                        >
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${statusColor}`}>{idx + 1}</div>
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${selectedStationId === station.id ? 'text-teal-800' : 'text-gray-700'}`}>{station.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="percent-pill">{calculateProgress(station)}%</span>
                              <span className="text-gray-500">complete</span>
                            </div>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                  {/* Final Milestone: Schedule Appointment */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        if (canSchedule) {
                          setActiveTab('appointment')
                        }
                      }}
                      disabled={!canSchedule}
                      className={`flex items-start gap-3 w-full text-left transition-all ${
                        canSchedule
                          ? 'bg-[#0050bb] text-white border border-[#0050bb] hover:bg-[#33d5e4] important-btn'
                          : 'bg-gray-50 text-gray-400 border border-gray-200 opacity-70 cursor-not-allowed'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${canSchedule ? 'bg-[#33d5e4]' : 'bg-gray-400'}`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${canSchedule ? 'text-white' : 'text-gray-500'}`}>Schedule Appointment</div>
                        <div className={`${canSchedule ? 'text-white/80' : 'text-gray-500'} text-xs`}>{canSchedule ? 'Ready' : 'Complete steps'}</div>
                      </div>
                    </button>
                    {!canSchedule && (
                      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 rounded-lg bg-black/85 text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition">
                        Complete all required tasks to unlock scheduling.
                      </div>
                    )}
                  </div>
                </div>
              </div>
             
              {nextPossibleTracks.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                  <h3 className="text-base font-semibold text-gray-800">Next possible tracks</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {nextPossibleTracks.map(({ track, isAvailable, progress }) => {
                      return (
                        <button
                          key={track.id}
                          onClick={() => {
                            if (!isAvailable) return;
                            setSelectedStationId(track.id);
                          }}
                          disabled={!isAvailable}
                          className={`text-left p-3 border rounded-lg transition-all flex flex-col gap-1 ${
                            isAvailable
                              ? 'border-[#0050bb] text-[#1d2b31] hover:border-[#33d5e4]'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                          }`}
                        >
                          <span className="text-sm font-semibold">{track.title}</span>
                          <p className="text-[11px] text-gray-500">{track.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="percent-pill">{progress}%</span>
                            <span className="uppercase tracking-wide">{isAvailable ? 'Unlocked' : 'Locked'}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main: only show selected station */}
          <main>
            {selectedStationId ? (
              (() => {
                const station = stationsWithProgress.find(s => s.id === selectedStationId)
                const progress = calculateProgress(station)
                const isCompleted = progress === 100
                const isAvailable = isStationAvailable(station, completedStations)
                const isLocked = !isAvailable && !isCompleted
                const stationSubpoints = station.subpoints || []
                const stationPageSize = 3
                const stationTotalPages = Math.max(1, Math.ceil(stationSubpoints.length / stationPageSize))
                const stationPaginated = stationSubpoints.slice((stationPage - 1) * stationPageSize, stationPage * stationPageSize)

                return (
                  <div className={`bg-gray-50 rounded-lg p-6 border-4 ${isCompleted ? 'border-green-500' : isAvailable ? 'border-teal-300' : 'border-gray-300'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-2xl font-bold ${isCompleted ? 'text-green-700' : isAvailable ? 'text-teal-700' : 'text-gray-600'}`}>{station.title}</h3>
                        <p className={`text-sm mt-1 ${isAvailable ? 'text-gray-600' : 'text-gray-500'}`}>{station.summary || station.description}</p>
                        {Array.isArray(station.links) && station.links.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {station.links.map(link => (
                              <li key={`${station.id}-${link.url}`}>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#0050bb] hover:underline flex items-center gap-1"
                                >
                                  <span>{link.label || link.url}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Progress</div>
                        <div className="text-2xl font-bold text-teal-600">{progress}%</div>
                      </div>
                    </div>
                    {isLocked && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <Lock className="w-3 h-3 inline mr-1" />
                          This task is locked. Complete the previous tasks to unlock it.
                        </p>
                      </div>
                    )}

                    

                    <div className={`mt-4 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Next Steps</h4>
                      <div className="space-y-3">
                        {stationPaginated.map(sp => {
                          const val = sp.key ? trackAnswers[sp.key] : undefined;
                          const isBooleanAnswered = val === true || val === false || val === 'true' || val === 'false'
                          const isDone = sp.type ? (
                            sp.type === 'boolean' ? isBooleanAnswered :
                            sp.type === 'file' ? (val && (val.name || val.filename || val.fileName)) :
                            val !== undefined && val !== null && `${val}`.toString().trim() !== ''
                          ) : sp.completed;

                          return (
                            <div key={sp.id} className={`p-3 rounded-lg border ${isDone ? 'bg-white border-green-200' : 'bg-white border-gray-200'}`}>
                              <div className="mb-2">
                                <div className="text-sm font-medium text-gray-800">{sp.label}</div>
                                {sp.help_text && <div className="text-xs text-gray-500 mt-1">{sp.help_text}</div>}
                              </div>

                              {/* Input controls based on type */}
                              {sp.type === 'boolean' ? (
                                <div className="flex gap-3">
                                  {['yes', 'no'].map(option => {
                                    const isYes = option === 'yes'
                                    const isSelected = isYes ? (val === true || val === 'true') : (val === false || val === 'false')
                                    return (
                                      <button
                                        key={option}
                                        type="button"
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                          isSelected
                                            ? 'bg-teal-600 text-white border-teal-600 focus:ring-teal-500'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                        }`}
                                        onClick={() => handleAnswerChange(sp.key, isYes)}
                                        data-field-key={isYes ? sp.key : undefined}
                                        aria-pressed={isSelected}
                                      >
                                        {isYes ? 'Yes' : 'No'}
                                      </button>
                                    )
                                  })}
                                </div>
                              ) : sp.type === 'long_text' ? (
                                <textarea
                                  value={val || ''}
                                  onChange={(e) => handleAnswerChange(sp.key, e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  data-field-key={sp.key}
                                />
                              ) : sp.type === 'number' ? (
                                <input
                                  type="number"
                                  value={val || ''}
                                  onChange={(e) => handleAnswerChange(sp.key, e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg"
                                  data-field-key={sp.key}
                                />
                              ) : sp.type === 'file' ? (
                                <div>
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      const f = e.target.files && e.target.files[0];
                                      if (!f) return;
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        handleAnswerChange(sp.key, { name: f.name, dataUrl: reader.result });
                                      };
                                      reader.readAsDataURL(f);
                                    }}
                                    data-field-key={sp.key}
                                  />
                                  {val && (val.name || val.filename) && <div className="text-xs text-gray-600 mt-1">{val.name || val.filename}</div>}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={val || ''}
                                  onChange={(e) => handleAnswerChange(sp.key, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  data-field-key={sp.key}
                                />
                              )}

                              <div className={`mt-2 text-xs font-medium ${isDone ? 'text-green-600' : sp.optional ? 'text-gray-500' : 'text-red-600'}`}>
                                {isDone ? 'Done' : (sp.optional ? 'Optional' : 'Pending')}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      {stationPage < stationTotalPages ? (
                        <button
                          onClick={() => setStationPage(prev => Math.min(prev + 1, stationTotalPages))}
                          disabled={isLocked}
                          className={`px-4 py-2 rounded-lg font-medium ${isLocked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                        >
                          {isLocked ? 'Locked' : 'Next page'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const completedSet = new Set(completedStations);
                            completedSet.add(station.id);
                            const nextStation = stations
                              .filter(s => !completedSet.has(s.id))
                              .filter(s => isStationAvailable(s, Array.from(completedSet)))
                              .sort((a, b) => a.order - b.order)[0];

                            if (nextStation) {
                              setSelectedStationId(nextStation.id);
                              setStationPage(1);
                              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
                            } else {
                              const firstIncompleteField = station.subpoints.find(sp => {
                                const val = sp.key ? trackAnswers[sp.key] : undefined;
                                const isBooleanAnswered = val === true || val === false || val === 'true' || val === 'false'
                                const isDone = sp.type ? (
                                  sp.type === 'boolean' ? isBooleanAnswered :
                                  sp.type === 'file' ? (val && (val.name || val.filename || val.fileName)) :
                                  val !== undefined && val !== null && `${val}`.toString().trim() !== ''
                                ) : sp.completed;
                                return !isDone;
                              });

                              if (firstIncompleteField) {
                                const fieldElement = document.querySelector(`[data-field-key="${firstIncompleteField.key}"]`);
                                if (fieldElement) {
                                  fieldElement.focus();
                                  fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-medium ${isLocked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                          disabled={isLocked}
                        >
                          {isLocked ? 'Locked' : 'Go to next step'}
                        </button>
                      )}
                      {stationPage > 1 && (
                        <button
                          onClick={() => setStationPage(prev => Math.max(prev - 1, 1))}
                          disabled={isLocked}
                          className={`px-3 py-2 rounded-lg border ${isLocked ? 'border-gray-300 text-gray-500 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:border-gray-500'}`}
                        >
                          Previous page
                        </button>
                      )}
                      {isCompleted && (
                        <div className="text-sm text-green-700 font-semibold">Completed</div>
                      )}
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">No station selected</div>
            )}
          </main>
        </div>
      </div>

      {/* Next Steps Section removed per user request */}
          </>
        ) : activeTab === 'answers' ? (
          <AnsweredSummary />
        ) : activeTab === 'appointment' ? (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            {canSchedule ? (
              <AppointmentScheduling canSchedule={canSchedule} />
            ) : (
              <p className="text-sm text-gray-600">
                Complete the required timeline steps to unlock scheduling.
              </p>
            )}
          </div>
        ) : null}


      </div>
    </div>
  );
}

export default DashboardRoadmap;
