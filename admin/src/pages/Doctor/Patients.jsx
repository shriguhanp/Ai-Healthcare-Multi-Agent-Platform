import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { DoctorContext } from '../../context/DoctorContext'

const Patients = () => {
  const { backendUrl, dToken } = useContext(DoctorContext)
  const [patients, setPatients] = useState([])
  const [active, setActive] = useState(null)

  const [medicine, setMedicine] = useState('')
  const [dosage, setDosage] = useState('')
  const [times, setTimes] = useState({ morning: false, afternoon: false, night: false })
  const [meal, setMeal] = useState('after')
  const [days, setDays] = useState(1)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await axios.get(backendUrl + '/api/doctor/patients', { headers: { dtoken: dToken } })
        if (data.success) setPatients(data.users)
      } catch (error) {
        console.error(error)
      }
    }
    if (dToken) fetchPatients()
  }, [dToken])

  const submitPrescription = async (userId) => {
    try {
      const prescription = {
        medicines: [
          {
            name: medicine,
            dosage,
            times: Object.keys(times).filter(k => times[k]),
            meal,
            days
          }
        ]
      }

      const { data } = await axios.post(backendUrl + '/api/doctor/prescribe', { userId, prescription, docId: dToken && JSON.parse(atob(dToken.split('.')[1]))?.id }, { headers: { dtoken: dToken } })
      if (data.success) {
        alert('Prescription added')
        setActive(null)
        setMedicine('')
        setDosage('')
        setTimes({ morning: false, afternoon: false, night: false })
        setMeal('after')
        setDays(1)
      }
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'Error')
    }
  }

  return (
    <div className='m-5'>
      <h1 className='text-lg font-medium mb-4'>Patients</h1>
      <div className='grid grid-cols-1 gap-4'>
        {patients.map(p => (
          <div key={p._id} className='p-4 bg-white rounded shadow'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-medium'>{p.name}</p>
                <p className='text-sm text-gray-600'>{p.email}</p>
              </div>
              <div>
                <button onClick={() => setActive(active === p._id ? null : p._id)} className='bg-primary text-white px-4 py-2 rounded'>Prescribe</button>
              </div>
            </div>
            {active === p._id && (
              <div className='mt-3'>
                <div className='flex flex-col gap-2'>
                  <input value={medicine} onChange={e => setMedicine(e.target.value)} placeholder='Tablet name' className='border px-2 py-1 rounded' />
                  <input value={dosage} onChange={e => setDosage(e.target.value)} placeholder='Dosage (e.g., 1 tablet)' className='border px-2 py-1 rounded' />
                  <div className='flex gap-2 items-center'>
                    <label><input type='checkbox' checked={times.morning} onChange={e => setTimes(t => ({ ...t, morning: e.target.checked }))} /> Morning</label>
                    <label><input type='checkbox' checked={times.afternoon} onChange={e => setTimes(t => ({ ...t, afternoon: e.target.checked }))} /> Afternoon</label>
                    <label><input type='checkbox' checked={times.night} onChange={e => setTimes(t => ({ ...t, night: e.target.checked }))} /> Night</label>
                  </div>
                  <select value={meal} onChange={e => setMeal(e.target.value)} className='border px-2 py-1 rounded'>
                    <option value='before'>Before Meal</option>
                    <option value='after'>After Meal</option>
                  </select>
                  <input type='number' value={days} min={1} onChange={e => setDays(Number(e.target.value))} className='border px-2 py-1 rounded' />
                  <div className='flex gap-2'>
                    <button onClick={() => submitPrescription(p._id)} className='bg-green-500 text-white px-4 py-2 rounded'>Save</button>
                    <button onClick={() => setActive(null)} className='bg-gray-200 px-4 py-2 rounded'>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Patients
