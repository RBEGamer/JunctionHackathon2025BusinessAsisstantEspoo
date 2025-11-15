import { useState } from 'react'
import { Lock, Calendar, Clock, MapPin, Users } from 'lucide-react'

function AppointmentScheduling({ canSchedule }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  })

  const [currentMonth, setCurrentMonth] = useState(new Date())

  const availableTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
  ]

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    setSelectedDate(null)
  }

  const handleDateSelect = (day) => {
    if (!canSchedule) return
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (newDate > new Date()) {
      setSelectedDate(newDate)
      setSelectedTime(null)
    }
  }

  const handleTimeSelect = (time) => {
    if (!canSchedule) return
    setSelectedTime(time)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitAppointment = (e) => {
    e.preventDefault()
    if (!canSchedule) return

    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      alert('Please fill in all required fields')
      return
    }

    const appointmentData = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      notes: formData.notes,
      location: 'Espoo Business Services, Espoo, Finland'
    }

    const appointments = JSON.parse(localStorage.getItem('scheduled-appointments') || '[]')
    appointments.push(appointmentData)
    localStorage.setItem('scheduled-appointments', JSON.stringify(appointments))

    alert(`Thank you, ${formData.name}! Your appointment has been scheduled for ${selectedDate.toDateString()} at ${selectedTime}. We'll contact you at ${formData.email} to confirm.`)
    
    // Reset form
    setSelectedDate(null)
    setSelectedTime(null)
    setFormData({ name: '', email: '', phone: '', notes: '' })
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = []
  
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div className={`${!canSchedule ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="space-y-6">
        {!canSchedule && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-center gap-3">
            <Lock className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold">Feature Locked</p>
              <p className="text-red-700 text-sm">Complete all required steps to unlock appointment scheduling.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Select a Date
            </h3>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                disabled={!canSchedule}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <h2 className="text-lg font-semibold text-gray-800">{monthName}</h2>
              <button
                onClick={handleNextMonth}
                disabled={!canSchedule}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
              {/* Day names */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => (
                  <div key={idx} className="aspect-square">
                    {day ? (
                      <button
                        onClick={() => handleDateSelect(day)}
                        disabled={!canSchedule}
                        className={`w-full h-full rounded-lg font-medium transition-all ${
                          selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth()
                            ? 'bg-teal-600 text-white border-2 border-teal-700 shadow-lg'
                            : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) > new Date()
                            ? 'bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 cursor-pointer disabled:opacity-50'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {day}
                      </button>
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-800">
                  <strong>Selected Date:</strong> {selectedDate.toDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Time Selection and Form */}
          <div className="space-y-6">
            {/* Time Slots */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                Select a Time
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {availableTimeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    disabled={!canSchedule || !selectedDate}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      selectedTime === time
                        ? 'bg-teal-600 text-white border-2 border-teal-700 shadow-lg'
                        : selectedDate && canSchedule
                        ? 'bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Meeting Location
              </h3>
              <p className="text-gray-700 text-sm">
                Espoo Business Services<br />
                Espoo, Finland
              </p>
              <div className="mt-4 flex items-center gap-2 text-teal-700 text-sm">
                <Users className="w-4 h-4" />
                Consulting Staff Available
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Form */}
        {selectedDate && selectedTime && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Information</h3>
            
            <form onSubmit={handleSubmitAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    disabled={!canSchedule}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    disabled={!canSchedule}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  disabled={!canSchedule}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  disabled={!canSchedule}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                  placeholder="Any additional information for your consultation..."
                />
              </div>

              <button
                type="submit"
                disabled={!canSchedule || !selectedDate || !selectedTime || !formData.name || !formData.email}
                className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                Confirm Appointment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentScheduling
