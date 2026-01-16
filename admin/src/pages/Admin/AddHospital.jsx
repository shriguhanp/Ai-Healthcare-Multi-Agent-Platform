import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { INDIAN_STATES, COUNTRIES } from '../../utils/constants'

const AddHospital = () => {

    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [timings, setTimings] = useState('')
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [about, setAbout] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')
    const [city, setCity] = useState('')
    const [country, setCountry] = useState('India')
    const [area, setArea] = useState('')
    const [pincode, setPincode] = useState('')

    const [selectedDoctors, setSelectedDoctors] = useState([])

    const { backendUrl } = useContext(AppContext)
    const { aToken, getAllHospitals, doctors, getAllDoctors } = useContext(AdminContext)

    React.useEffect(() => {
        if (aToken) {
            getAllDoctors()
        }
    }, [aToken])

    const handleDoctorSelection = (docId) => {
        setSelectedDoctors(prev =>
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        )
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {

            if (!docImg) {
                return toast.error('Image Not Selected')
            }

            const formData = new FormData();

            formData.append('image', docImg)
            formData.append('name', name)
            formData.append('email', email)
            formData.append('phone', phone)
            formData.append('timings', timings)
            formData.append('registrationNumber', registrationNumber)
            formData.append('about', about)
            formData.append('address', JSON.stringify({ line1: address1, line2: address2, city, country, area, pincode }))
            formData.append('doctorIds', JSON.stringify(selectedDoctors))

            const { data } = await axios.post(backendUrl + '/api/admin/add-hospital', formData, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllHospitals()
                setDocImg(false)
                setName('')
                setEmail('')
                setPhone('')
                setTimings('')
                setRegistrationNumber('')
                setAbout('')
                setAddress1('')
                setAddress2('')
                setCity('')
                setCountry('India')
                setArea('')
                setPincode('')
                setSelectedDoctors([])
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>

            <p className='mb-3 text-lg font-medium'>Add Hospital</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor="doc-img">
                        <img className='w-16 h-16 object-cover bg-gray-100 rounded-full cursor-pointer' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" name="" id="doc-img" hidden />
                    <p>Upload hospital <br /> picture</p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Hospital Name</p>
                            <input onChange={e => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Hospital Name' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Email</p>
                            <input onChange={e => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Email' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Phone</p>
                            <input onChange={e => setPhone(e.target.value)} value={phone} className='border rounded px-3 py-2' type="text" placeholder='Phone Number' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Timings (e.g. 09:00 AM - 09:00 PM)</p>
                            <input onChange={e => setTimings(e.target.value)} value={timings} className='border rounded px-3 py-2' type="text" placeholder='Timings' required />
                        </div>

                    </div>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Registration Number</p>
                            <input onChange={e => setRegistrationNumber(e.target.value)} value={registrationNumber} className='border rounded px-3 py-2' type="text" placeholder='Registration Number' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Address</p>
                            <input onChange={e => setAddress1(e.target.value)} value={address1} className='border rounded px-3 py-2' type="text" placeholder='Address 1' required />
                            <input onChange={e => setAddress2(e.target.value)} value={address2} className='border rounded px-3 py-2' type="text" placeholder='Address 2' />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Location Details</p>
                            <select onChange={e => setCountry(e.target.value)} value={country} className='border rounded px-3 py-2' required>
                                {COUNTRIES.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                            {country === 'India' ? (
                                <select onChange={e => setCity(e.target.value)} value={city} className='border rounded px-3 py-2' required>
                                    <option value="">Select State/UT</option>
                                    {INDIAN_STATES.map((state, index) => (
                                        <option key={index} value={state}>{state}</option>
                                    ))}
                                </select>
                            ) : (
                                <input onChange={e => setCity(e.target.value)} value={city} className='border rounded px-3 py-2' type="text" placeholder='City' required />
                            )}
                            <input onChange={e => setArea(e.target.value)} value={area} className='border rounded px-3 py-2' type="text" placeholder='Area' />
                            <input onChange={e => setPincode(e.target.value)} value={pincode} className='border rounded px-3 py-2' type="text" placeholder='Pincode' />
                        </div>

                    </div>

                </div>

                <div className='mb-6'>
                    <p className='mb-2'>Assign Doctors (Optional)</p>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto border p-3 rounded'>
                        {doctors.map((doc) => (
                            <div key={doc._id} className={`flex items-center gap-3 p-2 border rounded cursor-pointer transition-all ${selectedDoctors.includes(doc._id) ? 'border-primary bg-primary/5' : 'border-gray-200'}`} onClick={() => handleDoctorSelection(doc._id)}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedDoctors.includes(doc._id) ? 'bg-primary border-primary' : 'border-gray-400'}`}>
                                    {selectedDoctors.includes(doc._id) && <div className='w-2 h-2 bg-white rounded-full'></div>}
                                </div>
                                <div className='flex items-center gap-2'>
                                    <img src={doc.image} alt="" className='w-8 h-8 rounded-full object-cover' />
                                    <div>
                                        <p className='text-sm font-medium'>{doc.name}</p>
                                        <p className='text-xs text-gray-500'>{doc.speciality}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {doctors.length === 0 && <p className='text-xs text-gray-400 mt-1'>No doctors available to assign.</p>}
                </div>

                <div>
                    <p className='mt-4 mb-2'>About Hospital</p>
                    <textarea onChange={e => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' rows={5} placeholder='Write about hospital amenities and services'></textarea>
                </div>

                <button type='submit' className='bg-primary px-10 py-3 mt-4 text-white rounded-full'>Add Hospital</button>

            </div>

        </form >
    )
}

export default AddHospital
