import { useState } from 'react'
import { FileText, Send, Download, CheckCircle2 } from 'lucide-react'

function FundingQuestionnaire({ onSubmit }) {
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    countryOfOrigin: '',
    residencePermitNumber: '',
    
    // Business Information
    businessName: '',
    businessRegistrationNumber: '',
    businessStage: '',
    industry: '',
    businessDescription: '',
    legalEntityType: '',
    dateEstablished: '',
    
    // Funding Information
    fundingAmount: '',
    fundingCurrency: 'EUR',
    fundingPurpose: '',
    fundingType: [],
    previousFunding: '',
    previousFundingAmount: '',
    otherFundingSources: '',
    
    // Financial Information
    currentRevenue: '',
    projectedRevenue: '',
    monthlyExpenses: '',
    currentEmployees: '',
    plannedEmployees: '',
    ownCapital: '',
    
    // Business Plan Details
    hasBusinessPlan: '',
    marketAnalysis: '',
    competitiveAdvantage: '',
    targetMarket: '',
    marketingStrategy: '',
    
    // Additional Information
    languageServices: [],
    specialRequirements: '',
    timeline: '',
    additionalInfo: '',
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const totalSteps = 6
  const [draftId, setDraftId] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      const currentValues = formData[name] || []
      if (checked) {
        setFormData(prev => ({
          ...prev,
          [name]: [...currentValues, value]
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: currentValues.filter(v => v !== value)
        }))
      }
    } else {
      const newData = {
        ...formData,
        [name]: value
      }
      setFormData(newData)
      saveDraft(newData)
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateMandatoryFields = () => {
    const mandatoryFields = {
      // Step 1: Personal Information
      fullName: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      address: 'Address',
      city: 'City',
      postalCode: 'Postal Code',
      countryOfOrigin: 'Country of Origin',
      
      // Step 2: Business Information
      businessName: 'Business Name',
      businessStage: 'Business Stage',
      industry: 'Industry/Sector',
      businessDescription: 'Business Description',
      legalEntityType: 'Legal Entity Type',
      
      // Step 3: Funding Information
      fundingAmount: 'Funding Amount',
      fundingPurpose: 'Funding Purpose',
      
      // Step 5: Business Plan Details
      hasBusinessPlan: 'Business Plan Status',
    }

    const missingFields = []
    
    for (const [field, label] of Object.entries(mandatoryFields)) {
      const value = formData[field]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(label)
      }
    }

    // Check if at least one funding type is selected
    if (!formData.fundingType || formData.fundingType.length === 0) {
      missingFields.push('Funding Type(s)')
    }

    return missingFields
  }

  const missingFields = validateMandatoryFields()
  const isFormValid = missingFields.length === 0

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!isFormValid) {
      alert(`Please fill in all mandatory fields:\n\n${missingFields.join('\n')}`)
      return
    }

    setSubmitted(true)
    
    // Generate formatted report
    const report = generateReport(formData)
    
    // Save to localStorage for service employee review
    const submissions = JSON.parse(localStorage.getItem('funding-submissions') || '[]')
    submissions.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      data: formData,
      report: report
    })
    localStorage.setItem('funding-submissions', JSON.stringify(submissions))
    // remove draft if exists
    try {
      const drafts = JSON.parse(localStorage.getItem('funding-drafts') || '[]')
      const updatedDrafts = drafts.filter(d => d.id !== draftId)
      localStorage.setItem('funding-drafts', JSON.stringify(updatedDrafts))
      localStorage.removeItem('current-draft-id')
      setDraftId(null)
    } catch (e) {
      // ignore
    }
    
    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(formData, report)
    }
  }

  // Draft saving/loading
  const saveDraft = (data) => {
    try {
      const drafts = JSON.parse(localStorage.getItem('funding-drafts') || '[]')
      let id = draftId
      if (!id) {
        id = Date.now().toString()
        setDraftId(id)
        localStorage.setItem('current-draft-id', id)
      }

      const draftObj = {
        id,
        timestamp: new Date().toISOString(),
        data,
      }

      const existingIndex = drafts.findIndex(d => d.id === id)
      if (existingIndex >= 0) {
        drafts[existingIndex] = draftObj
      } else {
        drafts.push(draftObj)
      }

      localStorage.setItem('funding-drafts', JSON.stringify(drafts))
    } catch (e) {
      console.error('Failed to save draft', e)
    }
  }

  // Load resume draft if requested
  useState(() => {
    try {
      const resumeId = localStorage.getItem('resume-draft-id')
      if (resumeId) {
        const drafts = JSON.parse(localStorage.getItem('funding-drafts') || '[]')
        const draft = drafts.find(d => d.id === resumeId)
        if (draft) {
          setFormData(draft.data)
          setDraftId(draft.id)
          localStorage.setItem('current-draft-id', draft.id)
        }
        localStorage.removeItem('resume-draft-id')
      }
    } catch (e) {
      // ignore
    }
  })

  const generateReport = (data) => {
    return `
FUNDING APPLICATION QUESTIONNAIRE REPORT
========================================
Generated: ${new Date().toLocaleString()}

PERSONAL INFORMATION
-------------------
Full Name: ${data.fullName}
Email: ${data.email}
Phone: ${data.phone}
Address: ${data.address}
City: ${data.city}
Postal Code: ${data.postalCode}
Country of Origin: ${data.countryOfOrigin}
Residence Permit Number: ${data.residencePermitNumber || 'N/A'}

BUSINESS INFORMATION
-------------------
Business Name: ${data.businessName}
Business Registration Number: ${data.businessRegistrationNumber || 'Not yet registered'}
Business Stage: ${data.businessStage}
Industry: ${data.industry}
Legal Entity Type: ${data.legalEntityType}
Date Established: ${data.dateEstablished || 'N/A'}
Business Description:
${data.businessDescription}

FUNDING INFORMATION
-------------------
Requested Amount: ${data.fundingAmount} ${data.fundingCurrency}
Funding Purpose: ${data.fundingPurpose}
Funding Type(s): ${data.fundingType.join(', ') || 'Not specified'}
Previous Funding: ${data.previousFunding}
Previous Funding Amount: ${data.previousFundingAmount || 'N/A'}
Other Funding Sources: ${data.otherFundingSources || 'None'}

FINANCIAL INFORMATION
--------------------
Current Revenue: ${data.currentRevenue || 'N/A'} ${data.fundingCurrency}
Projected Revenue: ${data.projectedRevenue || 'N/A'} ${data.fundingCurrency}
Monthly Expenses: ${data.monthlyExpenses || 'N/A'} ${data.fundingCurrency}
Own Capital: ${data.ownCapital || 'N/A'} ${data.fundingCurrency}
Current Employees: ${data.currentEmployees || '0'}
Planned Employees: ${data.plannedEmployees || '0'}

BUSINESS PLAN DETAILS
---------------------
Has Business Plan: ${data.hasBusinessPlan}
Market Analysis: ${data.marketAnalysis || 'N/A'}
Competitive Advantage: ${data.competitiveAdvantage || 'N/A'}
Target Market: ${data.targetMarket || 'N/A'}
Marketing Strategy: ${data.marketingStrategy || 'N/A'}

ADDITIONAL INFORMATION
----------------------
Language Services Needed: ${data.languageServices.join(', ') || 'None'}
Special Requirements: ${data.specialRequirements || 'None'}
Timeline: ${data.timeline || 'Not specified'}
Additional Information:
${data.additionalInfo || 'None'}

========================================
END OF REPORT
    `.trim()
  }

  const downloadReport = () => {
    const report = generateReport(formData)
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `funding-application-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-800 mb-2">Application Submitted Successfully!</h3>
        <p className="text-gray-700 mb-6">
          Your funding application questionnaire has been submitted and is ready for review by our service employee.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={downloadReport}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
          <button
            onClick={() => {
              setSubmitted(false)
              setCurrentStep(1)
              setFormData({
                fullName: '', email: '', phone: '', address: '', city: '', postalCode: '',
                countryOfOrigin: '', residencePermitNumber: '', businessName: '',
                businessRegistrationNumber: '', businessStage: '', industry: '',
                businessDescription: '', legalEntityType: '', dateEstablished: '',
                fundingAmount: '', fundingCurrency: 'EUR', fundingPurpose: '',
                fundingType: [], previousFunding: '', previousFundingAmount: '',
                otherFundingSources: '', currentRevenue: '', projectedRevenue: '',
                monthlyExpenses: '', currentEmployees: '', plannedEmployees: '',
                ownCapital: '', hasBusinessPlan: '', marketAnalysis: '',
                competitiveAdvantage: '', targetMarket: '', marketingStrategy: '',
                languageServices: [], specialRequirements: '', timeline: '', additionalInfo: ''
              })
            }}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Funding Application Questionnaire</h2>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{currentStep} / {totalSteps}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country of Origin *
                </label>
                <input
                  type="text"
                  name="countryOfOrigin"
                  value={formData.countryOfOrigin}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Residence Permit Number
                </label>
                <input
                  type="text"
                  name="residencePermitNumber"
                  value={formData.residencePermitNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Stage *
                </label>
                <select
                  name="businessStage"
                  value={formData.businessStage}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select stage</option>
                  <option value="idea">Idea/Concept</option>
                  <option value="planning">Planning Phase</option>
                  <option value="startup">Startup (0-1 years)</option>
                  <option value="early">Early Stage (1-3 years)</option>
                  <option value="growth">Growth Stage (3+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry/Sector *
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Entity Type *
                </label>
                <select
                  name="legalEntityType"
                  value={formData.legalEntityType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="sole">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="llc">Limited Liability Company (LLC)</option>
                  <option value="corporation">Corporation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Established
                </label>
                <input
                  type="date"
                  name="dateEstablished"
                  value={formData.dateEstablished}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Description *
                </label>
                <textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your business, products, and services..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Funding Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Funding Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Amount Requested *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="fundingAmount"
                    value={formData.fundingAmount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    name="fundingCurrency"
                    value={formData.fundingCurrency}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="SEK">SEK</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Type(s) *
                </label>
                <div className="space-y-2">
                  {['Personal Savings', 'Bank Loan', 'Investor Funding', 'Government Grant', 'Crowdfunding', 'Other'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        name="fundingType"
                        value={type}
                        checked={formData.fundingType.includes(type)}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Purpose *
                </label>
                <textarea
                  name="fundingPurpose"
                  value={formData.fundingPurpose}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe how you plan to use the funding..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Have you received previous funding?
                </label>
                <select
                  name="previousFunding"
                  value={formData.previousFunding}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {formData.previousFunding === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Funding Amount
                  </label>
                  <input
                    type="number"
                    name="previousFundingAmount"
                    value={formData.previousFundingAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Funding Sources
                </label>
                <input
                  type="text"
                  name="otherFundingSources"
                  value={formData.otherFundingSources}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List any other funding sources you're pursuing..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Financial Information */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Annual Revenue
                </label>
                <input
                  type="number"
                  name="currentRevenue"
                  value={formData.currentRevenue}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projected Annual Revenue
                </label>
                <input
                  type="number"
                  name="projectedRevenue"
                  value={formData.projectedRevenue}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Operating Expenses
                </label>
                <input
                  type="number"
                  name="monthlyExpenses"
                  value={formData.monthlyExpenses}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Own Capital Available
                </label>
                <input
                  type="number"
                  name="ownCapital"
                  value={formData.ownCapital}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Number of Employees
                </label>
                <input
                  type="number"
                  name="currentEmployees"
                  value={formData.currentEmployees}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planned Number of Employees
                </label>
                <input
                  type="number"
                  name="plannedEmployees"
                  value={formData.plannedEmployees}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Business Plan Details */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Business Plan Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Do you have a business plan? *
                </label>
                <select
                  name="hasBusinessPlan"
                  value={formData.hasBusinessPlan}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="yes-complete">Yes, complete</option>
                  <option value="yes-draft">Yes, draft version</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Market Analysis
                </label>
                <textarea
                  name="marketAnalysis"
                  value={formData.marketAnalysis}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your market analysis..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Competitive Advantage
                </label>
                <textarea
                  name="competitiveAdvantage"
                  value={formData.competitiveAdvantage}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What makes your business unique?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Market
                </label>
                <textarea
                  name="targetMarket"
                  value={formData.targetMarket}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your target market..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marketing Strategy
                </label>
                <textarea
                  name="marketingStrategy"
                  value={formData.marketingStrategy}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your marketing strategy..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Additional Information */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language Services Needed
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Chinese', 'English', 'Swedish', 'Finnish'].map(lang => (
                    <label key={lang} className="flex items-center">
                      <input
                        type="checkbox"
                        name="languageServices"
                        value={lang}
                        checked={formData.languageServices.includes(lang)}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requirements
                </label>
                <textarea
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requirements or accommodations needed..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Timeline
                </label>
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Within 3 months, 6 months, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Information
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional information you'd like to provide..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg transition-colors ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Previous
          </button>
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={!isFormValid}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isFormValid
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                title={isFormValid ? '' : 'Please fill in all mandatory fields'}
              >
                <Send className="w-5 h-5" />
                Submit Application
              </button>
              {!isFormValid && (
                <div className="absolute bottom-0 right-0 transform translate-y-full mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm whitespace-nowrap">
                  {missingFields.length} field(s) missing
                </div>
              )}
            </>
          )}
        </div>
        
        {!isFormValid && currentStep === totalSteps && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold mb-2">Required fields are missing:</p>
            <ul className="text-red-600 text-sm space-y-1">
              {missingFields.map((field, idx) => (
                <li key={idx}>• {field}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  )
}

export default FundingQuestionnaire

