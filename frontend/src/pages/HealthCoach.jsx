import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import html2pdf from 'html2pdf.js'

const HealthCoach = () => {
  const { backendUrl, userData, dToken } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('schedule')
  const [loading, setLoading] = useState(false)
  const [scheduleData, setScheduleData] = useState(null)
  const [reminders, setReminders] = useState([])
  const [sideEffectInput, setSideEffectInput] = useState('')
  const [sideEffectResponse, setSideEffectResponse] = useState('')
  const [missedDoseResponse, setMissedDoseResponse] = useState('')
  const [sideEffectLoading, setSideEffectLoading] = useState(false)

  useEffect(() => {
    loadReminders()
  }, [userData])

  const loadReminders = () => {
    try {
      if (userData?.medicalAdherence) {
        const today = new Date().toDateString()
        const todayMeds = []
        
        userData.medicalAdherence.forEach(entry => {
          if (new Date(entry.date).toDateString() === today) {
            entry.medicines?.forEach((med, idx) => {
              const status = entry.medicineStatus?.[idx] || 'pending'
              if (status === 'pending') {
                todayMeds.push({
                  name: med.name,
                  dosage: med.dosage,
                  times: med.times || ['morning'],
                  meal: med.meal,
                  status
                })
              }
            })
          }
        })
        setReminders(todayMeds)
      }
    } catch (error) {
      console.error('Error loading reminders:', error)
    }
  }

  const generateSchedule = async () => {
    if (!userData?.medicalAdherence || userData.medicalAdherence.length === 0) {
      toast.error('No medications found. Please add medications first.')
      return
    }

    setLoading(true)
    try {
      const medicationList = []
      userData.medicalAdherence.forEach(entry => {
        entry.medicines?.forEach(med => {
          medicationList.push({
            name: med.name,
            dosage: med.dosage,
            times: med.times || ['morning'],
            meal: med.meal,
            days: med.days || 1
          })
        })
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const res = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a personalized medication schedule for these medications with optimal timings and meal considerations: ${JSON.stringify(medicationList)}. Include practical tips for adherence.`,
          agent: 'masc'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setScheduleData(data.reply)
          toast.success('Schedule generated successfully!')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleSideEffect = async () => {
    if (!sideEffectInput.trim()) {
      toast.error('Please describe the side effect')
      return
    }

    setSideEffectLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const res = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `A patient is experiencing the following side effect: "${sideEffectInput}". Based on trusted medical data, what are the safe recommendations? When should they contact a doctor? Provide clear, safe guidance.`,
          agent: 'masc'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSideEffectResponse(data.reply)
          toast.success('Guidance received!')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to get guidance')
    } finally {
      setSideEffectLoading(false)
    }
  }

  const handleMissedDose = async () => {
    setSideEffectLoading(true)
    try {
      const medicinesList = userData?.medicalAdherence
        ?.flatMap(e => e.medicines?.map(m => m.name) || [])
        .join(', ') || 'medications'

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const res = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I missed a dose of my medication (${medicinesList}). What should I do? Based on medical guidelines, should I take a double dose next time, take it as soon as I remember, or skip it? Provide safe, practical guidance.`,
          agent: 'masc'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setMissedDoseResponse(data.reply)
          toast.success('Guidance received!')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to get guidance')
    } finally {
      setSideEffectLoading(false)
    }
  }

  const downloadSchedulePDF = () => {
    const element = document.getElementById('schedule-table-pdf')
    if (!element) {
      toast.error('Schedule not found')
      return
    }

    const opt = {
      margin: 10,
      filename: 'medication-schedule.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    }

    html2pdf().set(opt).from(element).save()
    toast.success('PDF downloaded successfully!')
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 md:px-8'>
      <div className='max-w-6xl mx-auto'>
        
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center'>
              <span className='text-3xl'>🏥</span>
            </div>
            <div>
              <h1 className='text-4xl font-bold text-gray-800'>AI Health Coach</h1>
              <p className='text-gray-600 mt-1'>Personalized medication guidance & adherence support</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='flex flex-wrap gap-2 mb-6 bg-white rounded-lg shadow p-2'>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 md:flex-none py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📅 Schedule
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 md:flex-none py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'reminders'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🔔 Reminders ({reminders.length})
          </button>
          <button
            onClick={() => setActiveTab('side-effects')}
            className={`flex-1 md:flex-none py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'side-effects'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⚠️ Side Effects
          </button>
          <button
            onClick={() => setActiveTab('missed-dose')}
            className={`flex-1 md:flex-none py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'missed-dose'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⏰ Missed Dose
          </button>
        </div>

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='mb-6'>
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>📅 Personalized Schedule</h2>
              <p className='text-gray-600'>AI-optimized medication timing for maximum effectiveness</p>
            </div>

            <div className='flex flex-wrap gap-3 mb-6'>
              <button
                onClick={generateSchedule}
                disabled={loading}
                className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:shadow-lg disabled:opacity-50 font-semibold transition-all'
              >
                {loading ? '⏳ Generating...' : '✨ Generate Schedule'}
              </button>
              {scheduleData && (
                <button
                  onClick={downloadSchedulePDF}
                  className='bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg hover:shadow-lg font-semibold transition-all flex items-center gap-2'
                >
                  📥 Download PDF
                </button>
              )}
            </div>

            {scheduleData && (
              <div id='schedule-table-pdf' className='mb-8'>
                <div className='mb-6'>
                  <h3 className='text-lg font-bold text-gray-800 mb-4'>Your Medications Schedule</h3>
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse'>
                      <thead>
                        <tr className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white'>
                          <th className='border border-gray-300 px-4 py-3 text-left text-sm font-semibold'>Medicine</th>
                          <th className='border border-gray-300 px-4 py-3 text-left text-sm font-semibold'>Dosage</th>
                          <th className='border border-gray-300 px-4 py-3 text-left text-sm font-semibold'>Schedule</th>
                          <th className='border border-gray-300 px-4 py-3 text-left text-sm font-semibold'>Meal Timing</th>
                          <th className='border border-gray-300 px-4 py-3 text-left text-sm font-semibold'>Duration</th>
                          <th className='border border-gray-300 px-4 py-3 text-left text-sm font-semibold'>Doctor</th>
                          <th className='border border-gray-300 px-4 py-3 text-left text-sm font-semibold'>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userData?.medicalAdherence?.flatMap((entry, entryIdx) =>
                          (entry.medicines || []).map((med, medIdx) => (
                            <tr
                              key={`${entryIdx}-${medIdx}`}
                              className='hover:bg-blue-50 transition-colors border-b border-gray-200'
                            >
                              <td className='border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800'>
                                {med.name}
                              </td>
                              <td className='border border-gray-300 px-4 py-3 text-sm'>
                                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'>
                                  {med.dosage}
                                </span>
                              </td>
                              <td className='border border-gray-300 px-4 py-3 text-sm'>
                                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200'>
                                  {(med.times || ['As needed']).join(', ')}
                                </span>
                              </td>
                              <td className='border border-gray-300 px-4 py-3 text-sm'>
                                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200'>
                                  {med.meal}
                                </span>
                              </td>
                              <td className='border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700'>
                                {med.days} days
                              </td>
                              <td className='border border-gray-300 px-4 py-3 text-sm text-gray-700'>
                                {entry.docName || '—'}
                              </td>
                              <td className='border border-gray-300 px-4 py-3 text-sm text-gray-600'>
                                {new Date(entry.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {scheduleData && (
              <div className='bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6'>
                <h3 className='font-bold text-gray-800 mb-3'>💡 AI Recommendations</h3>
                <p className='text-gray-700 whitespace-pre-wrap leading-relaxed text-sm'>{scheduleData}</p>
              </div>
            )}

            {!scheduleData && !loading && (
              <div className='text-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-300'>
                <p className='text-4xl mb-3'>📋</p>
                <p className='text-lg font-bold text-gray-800 mb-2'>No Schedule Generated Yet</p>
                <p className='text-gray-600 text-sm'>Click the button above to generate your personalized medication schedule</p>
              </div>
            )}
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='mb-6'>
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>🔔 Today's Reminders</h2>
              <p className='text-gray-600'>Medications you need to take today</p>
            </div>

            {reminders.length === 0 ? (
              <div className='text-center py-12 bg-green-50 rounded-lg border border-green-200'>
                <p className='text-lg text-green-700 font-semibold'>✅ All caught up!</p>
                <p className='text-sm text-green-600 mt-2'>No pending medications for today</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {reminders.map((reminder, idx) => (
                  <div
                    key={idx}
                    className='border-l-4 border-yellow-500 bg-yellow-50 p-5 rounded-r-lg hover:shadow-md transition-shadow'
                  >
                    <h3 className='font-bold text-gray-800 text-lg mb-3'>{reminder.name}</h3>
                    <div className='space-y-2 text-sm text-gray-700'>
                      <p><strong>💊 Dosage:</strong> {reminder.dosage}</p>
                      <p><strong>🕐 Time(s):</strong> {reminder.times.join(', ')}</p>
                      <p><strong>🍽️ With meal:</strong> {reminder.meal}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Side Effects Tab */}
        {activeTab === 'side-effects' && (
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='mb-6'>
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>⚠️ Side Effect Guidance</h2>
              <p className='text-gray-600'>Get safe recommendations for medication side effects</p>
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Describe your side effect:</label>
              <textarea
                value={sideEffectInput}
                onChange={e => setSideEffectInput(e.target.value)}
                className='w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                placeholder='E.g., nausea, dizziness, headache, rash, etc.'
                rows='4'
              />
            </div>

            <button
              onClick={handleSideEffect}
              disabled={sideEffectLoading || !sideEffectInput.trim()}
              className='mb-6 w-full bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg disabled:opacity-50 font-semibold transition-all'
            >
              {sideEffectLoading ? '⏳ Getting guidance...' : '🔍 Get Safety Guidance'}
            </button>

            {sideEffectResponse && (
              <div className='bg-red-50 border-l-4 border-red-600 rounded-lg p-6'>
                <p className='text-gray-700 whitespace-pre-wrap leading-relaxed text-sm'>{sideEffectResponse}</p>
                <div className='mt-4 p-3 bg-red-100 rounded border border-red-300'>
                  <p className='text-xs font-semibold text-red-800'>⚠️ IMPORTANT: If experiencing severe symptoms, contact a doctor immediately or call emergency services.</p>
                </div>
              </div>
            )}

            {!sideEffectResponse && !sideEffectLoading && (
              <div className='text-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-300'>
                <p className='text-4xl mb-3'>🩺</p>
                <p className='text-lg font-bold text-gray-800 mb-2'>Describe Your Concern</p>
                <p className='text-gray-600 text-sm'>Enter your side effect details to get guidance from trusted medical data</p>
              </div>
            )}
          </div>
        )}

        {/* Missed Dose Tab */}
        {activeTab === 'missed-dose' && (
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='mb-6'>
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>⏰ Missed Dose Guidance</h2>
              <p className='text-gray-600'>Safe recommendations when you miss a dose</p>
            </div>

            <div className='bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6 mb-6'>
              <p className='text-sm text-amber-900 font-semibold'>
                👤 Based on your current medications: <span className='font-bold'>{userData?.medicalAdherence?.flatMap(e => e.medicines?.map(m => m.name) || []).slice(0, 3).join(', ')}</span>
              </p>
            </div>

            <button
              onClick={handleMissedDose}
              disabled={sideEffectLoading}
              className='mb-6 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg disabled:opacity-50 font-semibold transition-all'
            >
              {sideEffectLoading ? '⏳ Getting guidance...' : '📖 Get Missed Dose Guidance'}
            </button>

            {missedDoseResponse && (
              <div className='bg-amber-50 border-l-4 border-amber-600 rounded-lg p-6'>
                <p className='text-gray-700 whitespace-pre-wrap leading-relaxed text-sm'>{missedDoseResponse}</p>
              </div>
            )}

            {!missedDoseResponse && !sideEffectLoading && (
              <div className='text-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-300'>
                <p className='text-4xl mb-3'>⏰</p>
                <p className='text-lg font-bold text-gray-800 mb-2'>Get Expert Guidance</p>
                <p className='text-gray-600 text-sm'>Click above to understand what to do if you missed taking your medication</p>
              </div>
            )}
          </div>
        )}

        {/* Info Banner */}
        <div className='mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6'>
          <p className='text-sm text-blue-900'>
            <strong>💡 Disclaimer:</strong> This AI health coach provides general information based on trusted medical data. It is not a substitute for professional medical advice. Always consult your doctor or pharmacist for personalized medical guidance, especially in case of serious symptoms.
          </p>
        </div>
      </div>
    </div>
  )
}

export default HealthCoach
