import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function MedicalAdherence() {
  const { userData, backendUrl, token, loadUserProfileData } = useContext(AppContext)

  const [editing, setEditing] = useState({ entryDate: null, medIndex: null })
  const [editValues, setEditValues] = useState({ name: '', dosage: '', days: 1 })

  const entries = userData?.medicalAdherence || []

  const formatDate = (ts) => {
    try {
      return new Date(ts).toLocaleString()
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

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      {/* Header */}
      <h1 className='text-4xl font-bold text-[#262626] mb-2'>Medical Adherence</h1>
      <p className='text-gray-600 mb-8'>Track your prescribed medicines</p>

      {/* Prescriptions */}
      <div className='bg-white shadow-lg rounded-lg p-8'>
        <h2 className='text-2xl font-bold text-[#262626] mb-8'>Your Prescriptions</h2>

        {entries.length === 0 && (
          <p className='text-gray-500 text-lg text-center py-12'>
            No prescriptions from doctors yet.
          </p>
        )}

        {entries.map((entry, idx) => (
          <div key={idx} className='border-2 border-gray-200 rounded-lg p-8 mb-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b'>
              <div>
                <p className='text-gray-600 font-semibold'>Prescribed On</p>
                <p className='text-[#262626] text-lg mt-2'>{formatDate(entry.date)}</p>
              </div>
              <div>
                <p className='text-gray-600 font-semibold'>Doctor</p>
                <p className='text-[#262626] text-lg mt-2'>{entry.docName || 'N/A'}</p>
              </div>
              <div>
                <p className='text-gray-600 font-semibold'>Total Medicines</p>
                <p className='text-[#262626] text-lg mt-2'>
                  {(entry.medicines || []).length}
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              {(entry.medicines || []).map((m, i) => (
                <div key={i} className='border border-gray-200 rounded-lg p-6 bg-gray-50'>
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex-1'>
                      <p className='text-xl font-bold text-[#262626]'>{m.name}</p>
                      <p className='text-gray-600 mt-2 text-lg'>
                        <span className='font-semibold'>{m.dosage}</span> •
                        <span className='ml-2'>{m.times?.join(', ') || 'As prescribed'}</span> •
                        <span className='ml-2'>{m.meal}</span> •
                        <span className='ml-2 font-semibold text-primary'>
                          {m.days} {m.days > 1 ? 'days' : 'day'}
                        </span>
                      </p>
                    </div>

                    <div className='flex gap-3 ml-6'>
                      <button
                        title='Took medicine'
                        onClick={() => handleIntake(entry.date, i, 'taken')}
                        className='bg-green-100 text-green-700 rounded-full p-3 hover:bg-green-200 text-xl w-12 h-12'
                      >
                        ✓
                      </button>

                      <button
                        title='Missed medicine'
                        onClick={() => handleIntake(entry.date, i, 'missed')}
                        className='bg-red-100 text-red-700 rounded-full p-3 hover:bg-red-200 text-xl w-12 h-12'
                      >
                        ✕
                      </button>

                      <button
                        title='Edit'
                        onClick={() => startEdit(entry.date, i, m)}
                        className='bg-blue-100 text-blue-700 rounded-full p-3 hover:bg-blue-200 text-xl w-12 h-12'
                      >
                        ✎
                      </button>
                    </div>
                  </div>

                  {editing.entryDate === entry.date && editing.medIndex === i && (
                    <div className='mt-6 pt-6 border-t bg-white rounded-lg p-6'>
                      <h4 className='text-lg font-bold mb-4'>Edit Medicine</h4>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                        <input
                          value={editValues.name}
                          onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                          className='border-2 rounded-lg px-4 py-2'
                          placeholder='Medicine name'
                        />
                        <input
                          value={editValues.dosage}
                          onChange={e => setEditValues(v => ({ ...v, dosage: e.target.value }))}
                          className='border-2 rounded-lg px-4 py-2'
                          placeholder='Dosage'
                        />
                        <input
                          type='number'
                          min={0}
                          value={editValues.days}
                          onChange={e => setEditValues(v => ({ ...v, days: e.target.value }))}
                          className='border-2 rounded-lg px-4 py-2'
                          placeholder='Days'
                        />
                      </div>

                      <div className='flex gap-3'>
                        <button onClick={submitEdit} className='border-2 border-primary text-primary px-6 py-2 rounded-lg'>
                          Save
                        </button>
                        <button onClick={cancelEdit} className='border-2 px-6 py-2 rounded-lg'>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
