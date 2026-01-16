import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext'

const MedicationSchedule = () => {
  const { userData } = useContext(AppContext)

  const entries = userData?.medicalAdherence || []

  const getAllMedicines = () => {
    const allMeds = []
    entries.forEach((entry, entryIdx) => {
      entry.medicines?.forEach((med, medIdx) => {
        allMeds.push({
          ...med,
          prescribedDate: entry.date,
          prescribedBy: entry.docName,
          entryIdx,
          medIdx
        })
      })
    })
    return allMeds
  }

  const medicines = getAllMedicines()

  const formatDate = (ts) => {
    try {
      const date = new Date(ts)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 md:px-8'>
      <div className='max-w-7xl mx-auto'>
        
        {/* Header Section */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
              <span className='text-2xl'>📅</span>
            </div>
            <div>
              <h1 className='text-4xl font-bold text-gray-800'>Medication Schedule</h1>
              <p className='text-gray-600 mt-1'>Complete overview of all your prescriptions</p>
            </div>
          </div>
        </div>

        {/* Table Section */}
        {medicines.length === 0 ? (
          <div className='bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center'>
            <p className='text-5xl mb-3'>💊</p>
            <h3 className='text-xl font-bold text-gray-800 mb-2'>No Medications Yet</h3>
            <p className='text-gray-600'>Consult a doctor to get prescriptions and view your medication schedule.</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden'>
            
            {/* Table Header */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white'>
                    <th className='px-6 py-4 text-left text-sm font-bold uppercase tracking-wider'>💊 Medicine</th>
                    <th className='px-6 py-4 text-left text-sm font-bold uppercase tracking-wider'>📊 Dosage</th>
                    <th className='px-6 py-4 text-left text-sm font-bold uppercase tracking-wider'>🕐 Schedule</th>
                    <th className='px-6 py-4 text-left text-sm font-bold uppercase tracking-wider'>🍽️ Meal Timing</th>
                    <th className='px-6 py-4 text-left text-sm font-bold uppercase tracking-wider'>📅 Duration</th>
                    <th className='px-6 py-4 text-left text-sm font-bold uppercase tracking-wider'>👨‍⚕️ Doctor</th>
                    <th className='px-6 py-4 text-left text-sm font-bold uppercase tracking-wider'>📝 Prescribed</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className='divide-y divide-gray-200'>
                  {medicines.map((med, idx) => (
                    <tr 
                      key={idx} 
                      className='hover:bg-blue-50 transition-colors duration-200'
                    >
                      {/* Medicine Name */}
                      <td className='px-6 py-5'>
                        <div className='flex items-start gap-3'>
                          <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                            <span className='text-sm font-bold text-blue-600'>{med.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className='font-bold text-gray-800'>{med.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Dosage */}
                      <td className='px-6 py-5'>
                        <span className='inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300'>
                          {med.dosage}
                        </span>
                      </td>

                      {/* Schedule/Times */}
                      <td className='px-6 py-5'>
                        <div className='flex flex-wrap gap-2'>
                          {med.times?.length > 0 ? (
                            med.times.map((time, tIdx) => (
                              <span 
                                key={tIdx}
                                className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300'
                              >
                                {time.charAt(0).toUpperCase() + time.slice(1)}
                              </span>
                            ))
                          ) : (
                            <span className='text-gray-500 text-sm'>—</span>
                          )}
                        </div>
                      </td>

                      {/* Meal Timing */}
                      <td className='px-6 py-5'>
                        <span className='inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300 capitalize'>
                          {med.meal} meal
                        </span>
                      </td>

                      {/* Duration */}
                      <td className='px-6 py-5'>
                        <span className='inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300'>
                          {med.days} day{med.days > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Doctor Name */}
                      <td className='px-6 py-5'>
                        <p className='text-sm font-semibold text-gray-700'>{med.prescribedBy || '—'}</p>
                      </td>

                      {/* Prescribed Date */}
                      <td className='px-6 py-5'>
                        <p className='text-sm text-gray-600'>{formatDate(med.prescribedDate)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4'>
              <div>
                <p className='text-sm text-gray-600'>
                  <span className='font-bold text-gray-800'>{medicines.length}</span> active prescription{medicines.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className='text-xs text-gray-500'>
                Last updated: <span className='font-semibold text-gray-700'>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Legend/Info Section */}
        <div className='mt-8 grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='bg-white rounded-lg shadow p-4 border-l-4 border-blue-600'>
            <p className='text-xs font-bold text-gray-500 uppercase mb-1'>💊 Medicine</p>
            <p className='text-sm text-gray-700'>Generic or brand name of the medication</p>
          </div>
          <div className='bg-white rounded-lg shadow p-4 border-l-4 border-purple-600'>
            <p className='text-xs font-bold text-gray-500 uppercase mb-1'>🕐 Schedule</p>
            <p className='text-sm text-gray-700'>When to take the medicine daily</p>
          </div>
          <div className='bg-white rounded-lg shadow p-4 border-l-4 border-amber-600'>
            <p className='text-xs font-bold text-gray-500 uppercase mb-1'>🍽️ Meal Timing</p>
            <p className='text-sm text-gray-700'>Take before or after meals</p>
          </div>
          <div className='bg-white rounded-lg shadow p-4 border-l-4 border-emerald-600'>
            <p className='text-xs font-bold text-gray-500 uppercase mb-1'>📅 Duration</p>
            <p className='text-sm text-gray-700'>Total days to continue the medicine</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MedicationSchedule
