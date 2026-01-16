import React, { useContext } from 'react'
import { INDIAN_STATES, COUNTRIES } from '../utils/constants'
import { AppContext } from '../context/AppContext'

const LocationSelector = () => {
    const { selectedCity, updateSelectedCity, selectedCountry, updateSelectedCountry } = useContext(AppContext)

    return (
        <div className='flex flex-col sm:flex-row items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl sm:rounded-full shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group'>
            {/* Country Selector */}
            <div className='flex items-center gap-2 border-r border-gray-200 pr-3'>
                <div className='bg-primary/10 p-1.5 rounded-full group-hover:bg-primary transition-colors duration-300'>
                    <svg className='w-3.5 h-3.5 text-primary group-hover:text-white transition-colors duration-300' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className='flex flex-col'>
                    <span className='text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none'>Country</span>
                    <select
                        value={selectedCountry}
                        onChange={(e) => {
                            updateSelectedCountry(e.target.value)
                            updateSelectedCity('') // Reset city when country changes
                        }}
                        className='border-none outline-none bg-transparent text-gray-800 font-medium text-xs cursor-pointer pr-4 focus:ring-0 appearance-none'
                    >
                        {COUNTRIES.map((country, index) => (
                            <option key={index} value={country}>{country}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Region/City Selector */}
            <div className='flex items-center gap-2'>
                <div className='bg-primary/10 p-1.5 rounded-full group-hover:bg-primary transition-colors duration-300'>
                    <svg className='w-3.5 h-3.5 text-primary group-hover:text-white transition-colors duration-300' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div className='flex flex-col'>
                    <span className='text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none'>Region/City</span>
                    {selectedCountry === 'India' ? (
                        <select
                            value={selectedCity}
                            onChange={(e) => updateSelectedCity(e.target.value)}
                            className='border-none outline-none bg-transparent text-gray-800 font-medium text-xs cursor-pointer pr-4 focus:ring-0 appearance-none'
                        >
                            <option value="">All Regions</option>
                            {INDIAN_STATES.map((state, index) => (
                                <option key={index} value={state}>{state}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            placeholder="Type City..."
                            value={selectedCity}
                            onChange={(e) => updateSelectedCity(e.target.value)}
                            className='border-none outline-none bg-transparent text-gray-800 font-medium text-xs pr-4 focus:ring-0 w-24'
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default LocationSelector
