import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import { assets } from '../../assets/assets'

const HospitalList = () => {

    const { hospitals, aToken, getAllHospitals, deleteHospital } = useContext(AdminContext)
    const navigate = useNavigate()

    useEffect(() => {
        if (aToken) {
            getAllHospitals()
        }
    }, [aToken])

    console.log("HospitalList Render:", hospitals)

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            <h1 className='text-lg font-medium'>All Hospitals</h1>
            <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
                {hospitals && hospitals.length > 0 ? (
                    hospitals.map((item, index) => (
                        <div className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group relative' key={index}>
                            <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500 w-full h-40 object-cover' src={item.image || ''} alt={item.name} />
                            {/* Delete button */}
                            <div className='absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all'>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this hospital?')) {
                                            deleteHospital(item._id)
                                        }
                                    }}
                                    className='bg-white/90 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm'
                                >
                                    <img src={assets.cancel_icon} className='w-3.5 h-3.5' alt="delete" style={{ filter: 'none' }} />
                                </div>
                            </div>

                            <div className='p-4'>
                                <p className='text-[#262626] text-lg font-medium'>{item.name || 'Unknown'}</p>
                                <p className='text-[#5C5C5C] text-sm truncate'>{item.email}</p>
                                <p className='text-[#5C5C5C] text-sm mt-1'>{item.phone}</p>
                                <div className='mt-2 flex items-center gap-1 text-sm'>
                                    <span className='bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs'>{item.timings}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No hospitals found or loading...</p>
                )}
            </div>
        </div>
    )
}

export default HospitalList
