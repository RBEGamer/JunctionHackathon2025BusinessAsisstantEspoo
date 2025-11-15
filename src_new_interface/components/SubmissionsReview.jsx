import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, Trash2, Eye, Calendar, User, Building, Lock } from 'lucide-react'

function SubmissionsReview() {
  const [submissions, setSubmissions] = useState([])
  const [drafts, setDrafts] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadSubmissions()
    loadDrafts()
  }, [])

  const loadSubmissions = () => {
    const saved = localStorage.getItem('funding-submissions')
    if (saved) {
      setSubmissions(JSON.parse(saved))
    }
  }

  const loadDrafts = () => {
    const saved = localStorage.getItem('funding-drafts')
    if (saved) {
      setDrafts(JSON.parse(saved))
    }
  }

  const deleteSubmission = (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      const updated = submissions.filter(s => s.id !== id)
      setSubmissions(updated)
      localStorage.setItem('funding-submissions', JSON.stringify(updated))
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null)
      }
    }
  }

  const deleteDraft = (id) => {
    if (window.confirm('Delete this draft?')) {
      const updated = drafts.filter(d => d.id !== id)
      setDrafts(updated)
      localStorage.setItem('funding-drafts', JSON.stringify(updated))
      // if selectedSubmission corresponds to this draft, clear selection
      if (selectedSubmission?.id === id) setSelectedSubmission(null)
    }
  }

  const resumeDraft = (id) => {
    // mark resume id and navigate to funding station
    localStorage.setItem('resume-draft-id', id)
    navigate('/station/funding')
  }

  const downloadReport = (submission) => {
    const blob = new Blob([submission.report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `funding-application-${submission.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true
    const date = new Date(submission.timestamp)
    const now = new Date()
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (filter === 'today') return daysDiff === 0
    if (filter === 'week') return daysDiff <= 7
    if (filter === 'month') return daysDiff <= 30
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Funding Applications Review
        </h1>
        <p className="text-lg text-gray-600">
          Review and manage funding application submissions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Submissions</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredSubmissions.length}
              </span>
            </div>

            {/* Filter */}
            <div className="mb-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Submissions</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* In-progress Drafts */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                In-progress Applications
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {drafts.length === 0 ? (
                  <div className="text-sm text-gray-500">No in-progress applications</div>
                ) : (
                  drafts
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map(draft => (
                      <div key={draft.id} className="p-3 rounded-lg border bg-white flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">{draft.data.businessName || draft.data.fullName || 'Unnamed'}</div>
                          <div className="text-xs text-gray-500">{new Date(draft.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => resumeDraft(draft.id)} className="px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700">Resume</button>
                          <button onClick={() => deleteDraft(draft.id)} className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Delete</button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Submissions List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No submissions found</p>
                </div>
              ) : (
                filteredSubmissions
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() => setSelectedSubmission(submission)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSubmission?.id === submission.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {submission.data.businessName || submission.data.fullName || 'Unnamed'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {submission.data.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(submission.timestamp).toLocaleDateString()}
                        </div>
                        {submission.data.fundingAmount && (
                          <div className="font-medium text-blue-600">
                            {submission.data.fundingAmount} {submission.data.fundingCurrency || 'EUR'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Submission Details */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadReport(selectedSubmission)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => deleteSubmission(selectedSubmission.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Full Name:</span>
                      <p className="font-medium">{selectedSubmission.data.fullName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-medium">{selectedSubmission.data.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Phone:</span>
                      <p className="font-medium">{selectedSubmission.data.phone}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Country of Origin:</span>
                      <p className="font-medium">{selectedSubmission.data.countryOfOrigin}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">Address:</span>
                      <p className="font-medium">
                        {selectedSubmission.data.address}, {selectedSubmission.data.city} {selectedSubmission.data.postalCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Business Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Business Name:</span>
                      <p className="font-medium">{selectedSubmission.data.businessName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Business Stage:</span>
                      <p className="font-medium">{selectedSubmission.data.businessStage}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Industry:</span>
                      <p className="font-medium">{selectedSubmission.data.industry}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Legal Entity Type:</span>
                      <p className="font-medium">{selectedSubmission.data.legalEntityType}</p>
                    </div>
                    {selectedSubmission.data.businessDescription && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">Description:</span>
                        <p className="font-medium mt-1">{selectedSubmission.data.businessDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Funding Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Funding Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Amount Requested:</span>
                      <p className="font-medium text-lg text-blue-600">
                        {selectedSubmission.data.fundingAmount} {selectedSubmission.data.fundingCurrency || 'EUR'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Funding Type(s):</span>
                      <p className="font-medium">
                        {selectedSubmission.data.fundingType?.join(', ') || 'Not specified'}
                      </p>
                    </div>
                    {selectedSubmission.data.fundingPurpose && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">Purpose:</span>
                        <p className="font-medium mt-1">{selectedSubmission.data.fundingPurpose}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Information */}
                {(selectedSubmission.data.currentRevenue || selectedSubmission.data.projectedRevenue) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Financial Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                      {selectedSubmission.data.currentRevenue && (
                        <div>
                          <span className="text-sm text-gray-600">Current Revenue:</span>
                          <p className="font-medium">{selectedSubmission.data.currentRevenue} {selectedSubmission.data.fundingCurrency || 'EUR'}</p>
                        </div>
                      )}
                      {selectedSubmission.data.projectedRevenue && (
                        <div>
                          <span className="text-sm text-gray-600">Projected Revenue:</span>
                          <p className="font-medium">{selectedSubmission.data.projectedRevenue} {selectedSubmission.data.fundingCurrency || 'EUR'}</p>
                        </div>
                      )}
                      {selectedSubmission.data.ownCapital && (
                        <div>
                          <span className="text-sm text-gray-600">Own Capital:</span>
                          <p className="font-medium">{selectedSubmission.data.ownCapital} {selectedSubmission.data.fundingCurrency || 'EUR'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Report */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Full Report
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {selectedSubmission.report}
                    </pre>
                  </div>
                </div>

                {/* Submission Metadata */}
                <div className="text-sm text-gray-500 border-t pt-4">
                  <p>Submitted: {new Date(selectedSubmission.timestamp).toLocaleString()}</p>
                  <p>Submission ID: {selectedSubmission.id}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a submission to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubmissionsReview

