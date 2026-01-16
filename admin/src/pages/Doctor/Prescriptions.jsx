import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { DoctorContext } from '../../context/DoctorContext'
import { toast } from 'react-toastify'

const Prescriptions = () => {
  const { backendUrl, dToken } = useContext(DoctorContext)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState(null)
  const [editMedicines, setEditMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const getDoctorId = () => {
    try {
      if (dToken) {
        const decoded = JSON.parse(atob(dToken.split('.')[1]))
        return decoded.id
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
    return null
  }

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const docId = getDoctorId()
      if (!docId) {
        toast.error('Unable to fetch doctor ID')
        return
      }

      const { data } = await axios.post(
        backendUrl + '/api/doctor/prescriptions',
        { docId },
        { headers: { dtoken: dToken } }
      )

      if (data.success) {
        setPrescriptions(data.prescriptions)
      } else {
        toast.error(data.message || 'Failed to fetch prescriptions')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Error fetching prescriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dToken) {
      fetchPrescriptions()
    }
  }, [dToken])

  const handleEdit = (prescription) => {
    setEditingPrescription(prescription)
    setEditMedicines(JSON.parse(JSON.stringify(prescription.medicines)))
  }

  const handleSaveEdit = async () => {
    try {
      const docId = getDoctorId()
      const { data } = await axios.put(
        backendUrl + '/api/doctor/prescription/update',
        {
          userId: editingPrescription.userId,
          entryIndex: editingPrescription.entryIndex,
          medicines: editMedicines,
          docId
        },
        { headers: { dtoken: dToken } }
      )

      if (data.success) {
        toast.success('Prescription updated successfully')
        setEditingPrescription(null)
        fetchPrescriptions()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Error updating prescription')
    }
  }

  const handleDelete = async (prescription) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        const docId = getDoctorId()
        const { data } = await axios.delete(
          backendUrl + '/api/doctor/prescription/delete',
          {
            data: {
              userId: prescription.userId,
              entryIndex: prescription.entryIndex,
              docId
            },
            headers: { dtoken: dToken }
          }
        )

        if (data.success) {
          toast.success('Prescription deleted successfully')
          fetchPrescriptions()
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error(error.response?.data?.message || 'Error deleting prescription')
      }
    }
  }

  const updateMedicine = (idx, field, value) => {
    const updated = [...editMedicines]
    if (field === 'times') {
      updated[idx].times = value
    } else {
      updated[idx][field] = value
    }
    setEditMedicines(updated)
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredPrescriptions = prescriptions.filter(p =>
    p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='m-5'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800 mb-4'>My Prescriptions</h1>
        <input
          type='text'
          placeholder='Search by patient name or email...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </div>

      {loading ? (
        <div className='text-center py-10'>
          <p className='text-gray-600'>Loading prescriptions...</p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-8 text-center'>
          <p className='text-gray-500 text-lg'>No prescriptions found</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredPrescriptions.map((prescription, idx) => (
            <div key={prescription._id} className='bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden'>
              
              {/* Header */}
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-gray-200'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <div>
                    <p className='text-xs font-bold text-gray-500 uppercase'>Patient</p>
                    <p className='text-sm font-semibold text-gray-800'>{prescription.userName}</p>
                    <p className='text-xs text-gray-600'>{prescription.userEmail}</p>
                  </div>
                  <div>
                    <p className='text-xs font-bold text-gray-500 uppercase'>Date</p>
                    <p className='text-sm font-semibold text-gray-800'>{formatDate(prescription.date)}</p>
                    <p className='text-xs text-gray-600'>{formatTime(prescription.date)}</p>
                  </div>
                  <div>
                    <p className='text-xs font-bold text-gray-500 uppercase'>Medicines</p>
                    <p className='text-sm font-semibold text-gray-800'>{prescription.medicines?.length || 0}</p>
                  </div>
                  <div className='flex justify-end gap-2'>
                    <button
                      onClick={() => handleEdit(prescription)}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prescription)}
                      className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Medicines List */}
              <div className='p-5'>
                <div className='space-y-3'>
                  {prescription.medicines?.map((medicine, medIdx) => (
                    <div key={medIdx} className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <div>
                          <p className='text-xs font-bold text-gray-500 uppercase mb-1'>Name</p>
                          <p className='text-sm font-semibold text-gray-800'>{medicine.name}</p>
                        </div>
                        <div>
                          <p className='text-xs font-bold text-gray-500 uppercase mb-1'>Dosage</p>
                          <p className='text-sm font-semibold text-gray-800'>{medicine.dosage}</p>
                        </div>
                        <div>
                          <p className='text-xs font-bold text-gray-500 uppercase mb-1'>Times</p>
                          <p className='text-sm font-semibold text-gray-800'>{medicine.times?.join(', ') || 'N/A'}</p>
                        </div>
                        <div>
                          <p className='text-xs font-bold text-gray-500 uppercase mb-1'>Meal & Days</p>
                          <p className='text-sm font-semibold text-gray-800'>{medicine.meal} - {medicine.days}d</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPrescription && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-blue-600 text-white p-6 flex justify-between items-center'>
              <h2 className='text-xl font-bold'>Edit Prescription - {editingPrescription.userName}</h2>
              <button
                onClick={() => setEditingPrescription(null)}
                className='text-2xl font-bold hover:opacity-80'
              >
                ✕
              </button>
            </div>

            <div className='p-6 space-y-6'>
              {editMedicines.map((medicine, idx) => (
                <div key={idx} className='border border-gray-200 rounded-lg p-5 bg-gray-50'>
                  <h3 className='font-bold text-gray-800 mb-4'>Medicine {idx + 1}</h3>
                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>Name</label>
                      <input
                        type='text'
                        value={medicine.name}
                        onChange={e => updateMedicine(idx, 'name', e.target.value)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>Dosage</label>
                      <input
                        type='text'
                        value={medicine.dosage}
                        onChange={e => updateMedicine(idx, 'dosage', e.target.value)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>Times</label>
                      <div className='flex gap-3'>
                        {['morning', 'afternoon', 'night'].map(time => (
                          <label key={time} className='flex items-center gap-2'>
                            <input
                              type='checkbox'
                              checked={medicine.times?.includes(time) || false}
                              onChange={e => {
                                const times = medicine.times || []
                                const updated = e.target.checked
                                  ? [...times, time]
                                  : times.filter(t => t !== time)
                                updateMedicine(idx, 'times', updated)
                              }}
                            />
                            <span className='text-sm font-medium text-gray-700 capitalize'>{time}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-sm font-semibold text-gray-700 mb-1'>With Meal</label>
                        <select
                          value={medicine.meal || 'after'}
                          onChange={e => updateMedicine(idx, 'meal', e.target.value)}
                          className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          <option value='before'>Before</option>
                          <option value='after'>After</option>
                        </select>
                      </div>
                      <div>
                        <label className='block text-sm font-semibold text-gray-700 mb-1'>Days</label>
                        <input
                          type='number'
                          min='1'
                          value={medicine.days || 1}
                          onChange={e => updateMedicine(idx, 'days', Number(e.target.value))}
                          className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='sticky bottom-0 bg-gray-100 p-6 flex gap-3 justify-end border-t'>
              <button
                onClick={() => setEditingPrescription(null)}
                className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors'
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Prescriptions
