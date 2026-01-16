import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'

const DoctorsList = () => {

  const navigate = useNavigate()
  const { doctors, changeAvailability, aToken, getAllDoctors, deleteDoctor } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }
  }, [aToken])

  console.log("DoctorsList Render:", doctors)

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Doctors</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {doctors && doctors.length > 0 ? (
          doctors.map((item, index) => (
            <div className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group relative' key={index}>
              <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500 w-full h-40 object-cover' src={item.image || ''} alt={item.name} />
              {/* Edit & Delete buttons */}
              <div className='absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all'>
                {/* Edit button */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/edit-doctor/${item._id}`)
                  }}
                  className='bg-white/90 p-1.5 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                {/* Delete button (X icon) */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this doctor?')) {
                      deleteDoctor(item._id)
                    }
                  }}
                  className='bg-white/90 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className='p-4'>
                <p className='text-[#262626] text-lg font-medium'>{item.name || 'No Name'}</p>
                <p className='text-[#5C5C5C] text-sm'>{item.speciality || 'General'}</p>
                <div className='mt-2 flex items-center gap-1 text-sm'>
                  <input onChange={() => changeAvailability(item._id)} type="checkbox" checked={!!item.available} />
                  <p>Available</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No doctors found or loading...</p>
        )}
      </div>
    </div>
  )
}

export default DoctorsList