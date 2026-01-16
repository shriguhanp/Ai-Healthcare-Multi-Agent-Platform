import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function MedicalAdherence() {
  const { userData, backendUrl, token, loadUserProfileData } = useContext(AppContext)

  const [editing, setEditing] = useState({ entryDate: null, medIndex: null })
  const [editValues, setEditValues] = useState({ name: '', dosage: '', days: 1 })
  const [expandedEntry, setExpandedEntry] = useState(null)

  const entries = userData?.medicalAdherence || []

  const formatDate = (ts) => {
    try {
      const date = new Date(ts)
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const formatTime = (ts) => {
    try {
      const date = new Date(ts)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const handleIntake = async (entryDate, medIndex, action) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/medication/intake',
        { userId: userData._id, entryDate, medIndex, action },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message || 'Updated')
        await loadUserProfileData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const startEdit = (entryDate, medIndex, med) => {
    setEditing({ entryDate, medIndex })
    setEditValues({
      name: med.name || '',
      dosage: med.dosage || '',
      days: med.days || 1
    })
  }

  const submitEdit = async () => {
    try {
      const updates = {
        name: editValues.name,
        dosage: editValues.dosage,
        days: Number(editValues.days)
      }

      const { data } = await axios.post(
        backendUrl + '/api/user/medication/edit',
        {
          userId: userData._id,
          entryDate: editing.entryDate,
          medIndex: editing.medIndex,
          updates
        },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)
        setEditing({ entryDate: null, medIndex: null })
        await loadUserProfileData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const cancelEdit = () => {
    setEditing({ entryDate: null, medIndex: null })
  }

  const handleDelete = async (entryDate, medIndex, medName) => {
    if (!window.confirm(`Are you sure you want to delete "${medName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/medication/delete',
        {
          userId: userData._id,
          entryDate,
          medIndex
        },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message || 'Medication deleted')
        await loadUserProfileData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete medication')
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 md:px-8'>
      <div className='max-w-6xl mx-auto'>
        
        {/* Header Section */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
              <span className='text-2xl'>📋</span>
            </div>
            <div>
              <h1 className='text-4xl font-bold text-gray-800'>Digital Prescription</h1>
              <p className='text-gray-600 mt-1'>Manage and track your medications with ease</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
            <div className='mb-4'>
              <span className='text-6xl'>💊</span>
            </div>
            <h3 className='text-xl font-semibold text-gray-800 mb-2'>No Prescriptions Yet</h3>
            <p className='text-gray-600'>Consult a doctor to get your prescriptions and start tracking your medications.</p>
          </div>
        )}

        {/* Prescriptions List */}
        {entries.map((entry, idx) => (
          <div key={idx} className='mb-6'>
            
            {/* Prescription Header Card */}
            <div 
              onClick={() => setExpandedEntry(expandedEntry === idx ? null : idx)}
              className='bg-white rounded-t-xl shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow duration-300'
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div>
                      <p className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-1'>Date</p>
                      <p className='text-sm font-semibold text-gray-800'>{formatDate(entry.date)}</p>
                      <p className='text-xs text-gray-500'>{formatTime(entry.date)}</p>
                    </div>
                    <div>
                      <p className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-1'>Doctor</p>
                      <p className='text-sm font-semibold text-gray-800'>{entry.docName || '—'}</p>
                    </div>
                    <div>
                      <p className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-1'>Medications</p>
                      <p className='text-sm font-semibold text-gray-800'>{(entry.medicines || []).length}</p>
                    </div>
                    <div>
                      <p className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-1'>Status</p>
                      <p className='text-sm font-semibold text-blue-600'>Active</p>
                    </div>
                  </div>
                </div>
                <div className='ml-4'>
                  <span className={`text-xl transition-transform ${expandedEntry === idx ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </div>
            </div>

            {/* Medicines Grid */}
            {expandedEntry === idx && (
              <div className='bg-gray-50 rounded-b-xl shadow-md border border-t-0 border-gray-200 p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  {(entry.medicines || []).map((m, i) => (
                    <div key={i} className='bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow'>
                      
                      {/* Medicine Name & Info */}
                      <div className='mb-4'>
                        <h3 className='text-lg font-bold text-gray-800'>{m.name}</h3>
                        <div className='flex flex-wrap gap-2 mt-3'>
                          <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'>
                            💊 {m.dosage}
                          </span>
                          <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200'>
                            🕐 {m.times?.join(', ') || 'As needed'}
                          </span>
                          <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200'>
                            🍽️ {m.meal}
                          </span>
                          <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'>
                            📅 {m.days} day{m.days > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='space-y-2 mb-4'>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => handleIntake(entry.date, i, 'taken')}
                            className='flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2'
                          >
                            ✓ Taken
                          </button>
                          <button
                            onClick={() => handleIntake(entry.date, i, 'missed')}
                            className='flex-1 bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2'
                          >
                            ✗ Missed
                          </button>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => startEdit(entry.date, i, m)}
                            className='flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm'
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.date, i, m.name)}
                            className='flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm'
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      {/* Edit Form */}
                      {editing.entryDate === entry.date && editing.medIndex === i && (
                        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4'>
                          <h4 className='text-sm font-bold text-gray-800 mb-3'>Edit Medication</h4>
                          <div className='space-y-3'>
                            <input
                              value={editValues.name}
                              onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                              className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                              placeholder='Medicine name'
                            />
                            <div className='grid grid-cols-2 gap-3'>
                              <input
                                value={editValues.dosage}
                                onChange={e => setEditValues(v => ({ ...v, dosage: e.target.value }))}
                                className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Dosage'
                              />
                              <input
                                type='number'
                                min={0}
                                value={editValues.days}
                                onChange={e => setEditValues(v => ({ ...v, days: e.target.value }))}
                                className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Days'
                              />
                            </div>
                            <div className='flex gap-2 pt-2'>
                              <button 
                                onClick={cancelEdit} 
                                className='flex-1 text-gray-700 hover:text-gray-900 font-medium py-2 border border-gray-300 rounded-lg transition-colors'
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={submitEdit} 
                                className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors'
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
