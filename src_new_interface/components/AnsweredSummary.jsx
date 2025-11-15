import { useMemo, useState, useEffect } from 'react'
import { stations } from '../data/stations'

const getStoredAnswers = () => {
  try {
    return JSON.parse(localStorage.getItem('track_answers') || '{}')
  } catch (e) {
    return {}
  }
}

const getStoredCompanyData = () => {
  try {
    return JSON.parse(localStorage.getItem('company-data') || '{}')
  } catch (e) {
    return {}
  }
}

const formatAnswer = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') {
    return value.name || value.filename || value.fileName || JSON.stringify(value)
  }
  return `${value}`
}

function AnsweredSummary() {
  const [trackAnswers, setTrackAnswers] = useState(getStoredAnswers)
  const [companyData, setCompanyData] = useState(getStoredCompanyData)

  useEffect(() => {
    const handler = () => {
      setTrackAnswers(getStoredAnswers())
      setCompanyData(getStoredCompanyData())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const companyDetails = useMemo(() => {
    const details = []
    if (companyData.companyName) {
      details.push({ label: 'Company Name', value: companyData.companyName })
    }
    if (companyData.industry) {
      details.push({ label: 'Industry', value: companyData.industry })
    }
    if (companyData.contactEmail) {
      details.push({ label: 'Contact Email', value: companyData.contactEmail })
    }
    if (companyData.companyIdea) {
      details.push({ label: 'Company Idea', value: companyData.companyIdea })
    }
    return details
  }, [companyData])

  const answeredItems = useMemo(() => {
    const list = []
    stations.forEach((station) => {
      station.subpoints.forEach((subpoint) => {
        if (!subpoint.key) return
        const raw = trackAnswers[subpoint.key]
        const text = formatAnswer(raw)
        if (!text) return
        list.push({
          trackId: station.id,
          trackTitle: station.title,
          question: subpoint.label,
          answer: text,
        })
      })
    })
    return list
  }, [trackAnswers])

  const groupedByTrack = useMemo(() => {
    return answeredItems.reduce((acc, item) => {
      if (!acc[item.trackId]) {
        acc[item.trackId] = {
          trackTitle: item.trackTitle,
          items: [],
        }
      }
      acc[item.trackId].items.push(item)
      return acc
    }, {})
  }, [answeredItems])

  const summaryText = useMemo(() => {
    if (answeredItems.length === 0) {
      return 'No answers recorded yet.'
    }
    const lines = []
    lines.push('Company Information')
    if (companyDetails.length > 0) {
      companyDetails.forEach(detail => {
        lines.push(`  • ${detail.label}: ${detail.value}`)
      })
    } else {
      lines.push('  • No company information entered yet.')
    }
    lines.push('')
    lines.push('ESPI Answer Summary')
    lines.push('')
    Object.values(groupedByTrack).forEach((group) => {
      lines.push(group.trackTitle)
      group.items.forEach((item) => {
        lines.push(`  • ${item.question}: ${item.answer}`)
      })
      lines.push('')
    })
    return lines.join('\n')
  }, [groupedByTrack, answeredItems, companyDetails])

  const handleExport = () => {
    const blob = new Blob([summaryText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'espi-answers-summary.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Answered Questions</h1>
          <p className="text-sm text-gray-500">Track your submitted answers by section and export a summary.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setTrackAnswers(getStoredAnswers())
              setCompanyData(getStoredCompanyData())
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 transition"
          >
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
          >
            Export txt
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg border border-teal-600 text-teal-600 hover:bg-teal-50 transition"
          >
            Print summary
          </button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Company Information</h2>
            <p className="text-sm text-gray-500">This header mirrors the Company Info entries so you can quickly reference the saved values.</p>
          </div>
          <span className="text-sm text-gray-500">
            {companyDetails.length > 0 ? `${companyDetails.length} field(s)` : 'No fields yet'}
          </span>
        </div>
        {companyDetails.length === 0 ? (
          <p className="text-sm text-gray-500">No company information recorded yet. Fill out the Company Info tab to populate this summary.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {companyDetails.map(detail => (
              <div key={detail.label} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{detail.label}</p>
                <p className="text-sm text-gray-900 mt-1">{detail.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {answeredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
          No answers recorded yet. Complete questions from the roadmap to populate this view.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByTrack).map((group) => (
            <div key={group.trackTitle} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{group.trackTitle}</h2>
                  <p className="text-sm text-gray-500">{group.items.length} answered question(s)</p>
                </div>
              </div>
              <dl className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.question} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <dt className="text-sm font-semibold text-gray-700">{item.question}</dt>
                    <dd className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AnsweredSummary
