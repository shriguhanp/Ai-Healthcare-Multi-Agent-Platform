import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'
import LocationSelector from '../components/LocationSelector'

const Hospitals = () => {

    const { hospitals, doctors, selectedCity, selectedCountry } = useContext(AppContext)
    const [filterHospitals, setFilterHospitals] = useState([])
    const [hospitalDoctors, setHospitalDoctors] = useState([])
    const [hospitalData, setHospitalData] = useState(null)
    const { hospitalId } = useParams()
    const navigate = useNavigate()

    const applyFilter = () => {
        if (hospitalId) {
            const data = hospitals.find(item => item._id === hospitalId)
            setHospitalData(data)

            const docs = doctors.filter(doc => doc.hospitalId === hospitalId)
            setHospitalDoctors(docs)
        } else {
            let filtered = [...hospitals]

            if (selectedCountry) {
                filtered = filtered.filter(item => (item.address?.country || 'India') === selectedCountry)
            }

            if (selectedCity) {
                filtered = filtered.filter(item => item.address?.city === selectedCity)
            }

            setFilterHospitals(filtered)
            setHospitalData(null)
        }
    }

    useEffect(() => {
        if (hospitals.length > 0 && doctors.length > 0) {
            applyFilter()
        }
    }, [hospitals, doctors, selectedCountry, selectedCity, hospitalId])

    return hospitalId && hospitalData ? (
        <div>
            {/* Hospital Details Header */}
            <div className='flex flex-col md:flex-row gap-5 mb-10'>
                <img className='w-full md:w-80 h-64 object-cover rounded-lg' src={hospitalData.image} alt="" />
                <div className='flex flex-col justify-center gap-3 text-sm text-gray-600'>
                    <h1 className='text-3xl font-medium text-gray-800'>{hospitalData.name}</h1>
                    <p className='text-base'>{hospitalData.about}</p>
                    <div className='flex items-center gap-2 mt-2'>
                        <span className='font-medium text-gray-800'>Timings:</span>
                        <span className='bg-primary/10 text-primary px-3 py-1 rounded-full text-xs'>{hospitalData.timings}</span>
                    </div>
                    {hospitalData.location && (
                        <div className='mt-2'>
                            <p className='font-medium text-gray-800 mb-1'>Location:</p>
                            <p>{hospitalData.address?.line1}, {hospitalData.address?.line2}</p>
                            <p>{hospitalData.address?.line1}, {hospitalData.address?.line2}</p>
                            <p>{hospitalData.address?.city}, {hospitalData.address?.area} - {hospitalData.address?.pincode}</p>
                            <p>{hospitalData.address?.country || 'India'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Doctors List */}
            <div>
                <h2 className='text-2xl font-medium text-gray-700 mb-6'>Doctors Available at {hospitalData.name}</h2>
                {hospitalDoctors.length > 0 ? (
                    <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
                        {/* Reuse the Doctor Card UI */}
                        {hospitalDoctors.map((item, index) => (
                            <div onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500' key={index}>
                                <img className='bg-[#EAEFFF]' src={item.image} alt="" />
                                <div className='p-4'>
                                    <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                                        <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p><p>{item.available ? 'Available' : "Not Available"}</p>
                                    </div>
                                    <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
                                    <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className='text-gray-500'>No doctors currently listed for this hospital.</p>
                )}
            </div>

            <button onClick={() => navigate('/hospitals')} className='mt-10 text-gray-500 hover:text-gray-800 underline text-sm'>Back to All Hospitals</button>
        </div>
    ) : (
        <div>
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-10'>
                <div>
                    <h1 className='text-3xl font-medium text-gray-700'>Partner Hospitals</h1>
                    <p className='text-gray-500 text-sm mt-1'>
                        {selectedCity ? `Showing hospitals in ${selectedCity}, ${selectedCountry}` : `Browse hospitals in ${selectedCountry}`}
                    </p>
                </div>
                <LocationSelector />
            </div>

            <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
                {filterHospitals.map((item, index) => (
                    <div onClick={() => { navigate(`/hospitals/${item._id}`); scrollTo(0, 0) }} className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500' key={index}>
                        <img className='bg-[#EAEFFF] w-full h-48 object-cover' src={item.image} alt="" />
                        <div className='p-4'>
                            <h2 className='text-[#262626] text-lg font-medium'>{item.name}</h2>
                            <p className='text-[#5C5C5C] text-sm mt-1 line-clamp-2'>{item.about}</p>
                            <div className='flex items-center gap-2 mt-2 text-xs text-gray-500'>
                                <span className='bg-primary/10 text-primary px-2 py-0.5 rounded'>{item.timings}</span>
                            </div>
                            {item.address?.city && (
                                <p className='text-[#888] text-xs mt-3 flex items-center gap-1'>
                                    <svg className='w-3 h-3' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {item.address.city}, {item.address.country || 'India'}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filterHospitals.length === 0 && (
                <div className='mt-10 text-center text-gray-500'>
                    <p>No hospitals found in this location.</p>
                </div>
            )}
        </div>
    )
}

export default Hospitals
