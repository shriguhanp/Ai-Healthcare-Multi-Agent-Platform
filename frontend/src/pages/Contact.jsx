import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import LocationSelector from '../components/LocationSelector'

const Contact = () => {

  const { doctors, selectedCity, selectedCountry } = useContext(AppContext)
  const [filterDoc, setFilterDoc] = useState([])
  const [speciality, setSpeciality] = useState('') // New state for speciality
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate()

  const applyFilter = () => {
    let filtered = [...doctors]

    if (selectedCountry) {
      filtered = filtered.filter(doc => (doc.location?.country || 'India') === selectedCountry)
    }

    if (selectedCity) {
      filtered = filtered.filter(doc => doc.location?.city === selectedCity)
    }

    if (speciality) {
      filtered = filtered.filter(doc => doc.speciality === speciality)
    }

    setFilterDoc(filtered)
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, selectedCity, selectedCountry, speciality])


  return (
    <div>

      <div className='text-center text-2xl pt-10 text-[#707070]'>
        <p>CHAT WITH <span className='text-gray-700 font-semibold'>SPECIALISTS</span></p>
      </div>

      {/* New Doctor Chat Directory Section */}
      <div className='py-16'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-10'>
          <div>
            <h2 className='text-3xl font-medium text-gray-700'>Chat with our Specialists</h2>
            <p className='text-gray-500 text-sm mt-1'>
              Select a doctor to start a private consultation instantly.
            </p>
          </div>
          <LocationSelector />
        </div>

        <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
          {/* Specialty Filter Sidebar */}
          <div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'} min-w-48`}>
            <p onClick={() => setSpeciality(prev => prev === 'General physician' ? '' : 'General physician')} className={`pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'General physician' ? 'bg-[#E2E5FF] text-black ' : 'bg-white'}`}>General physician</p>
            <p onClick={() => setSpeciality(prev => prev === 'Gynecologist' ? '' : 'Gynecologist')} className={`pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Gynecologist' ? 'bg-[#E2E5FF] text-black ' : 'bg-white'}`}>Gynecologist</p>
            <p onClick={() => setSpeciality(prev => prev === 'Dermatologist' ? '' : 'Dermatologist')} className={`pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Dermatologist' ? 'bg-[#E2E5FF] text-black ' : 'bg-white'}`}>Dermatologist</p>
            <p onClick={() => setSpeciality(prev => prev === 'Pediatricians' ? '' : 'Pediatricians')} className={`pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Pediatricians' ? 'bg-[#E2E5FF] text-black ' : 'bg-white'}`}>Pediatricians</p>
            <p onClick={() => setSpeciality(prev => prev === 'Neurologist' ? '' : 'Neurologist')} className={`pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Neurologist' ? 'bg-[#E2E5FF] text-black ' : 'bg-white'}`}>Neurologist</p>
            <p onClick={() => setSpeciality(prev => prev === 'Gastroenterologist' ? '' : 'Gastroenterologist')} className={`pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Gastroenterologist' ? 'bg-[#E2E5FF] text-black ' : 'bg-white'}`}>Gastroenterologist</p>
          </div>

          <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
            {filterDoc.slice(0, 12).map((item, index) => (
              <div key={index} className='border border-[#C9D8FF] rounded-xl overflow-hidden hover:translate-y-[-10px] transition-all duration-500 flex flex-col'>
                <img className='bg-[#EAEFFF] w-full h-48 object-cover' src={item.image} alt="" />
                <div className='p-4 flex-1 flex flex-col'>
                  <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                    <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p>
                    <p>{item.available ? 'Available' : "Not Available"}</p>
                  </div>
                  <p className='text-[#262626] text-lg font-medium mt-2'>{item.name}</p>
                  <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
                  {item.location?.city && (
                    <p className='text-[#888] text-xs mt-1 flex items-center gap-1'>
                      <svg className='w-3 h-3' fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {item.location.city}, {item.location.country || 'India'}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      if (!item.available) {
                        alert("This doctor is currently unavailable.");
                        return;
                      }
                      navigate(`/chat/${item._id}`);
                      scrollTo(0, 0);
                    }}
                    className={`mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2 ${item.available ? 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    Start Chat
                  </button>

                </div>
              </div>
            ))}

            {filterDoc.length === 0 && (
              <div className='col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-lg'>
                <p>No doctors found in this location.</p>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  )
}

export default Contact
