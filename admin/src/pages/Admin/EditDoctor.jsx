import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { INDIAN_STATES, COUNTRIES } from '../../utils/constants'
import { useNavigate, useParams } from 'react-router-dom'

const EditDoctor = () => {

    const { docId } = useParams()
    const navigate = useNavigate()

    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [experience, setExperience] = useState('1 Year')
    const [fees, setFees] = useState('')
    const [about, setAbout] = useState('')
    const [speciality, setSpeciality] = useState('General physician')
    const [degree, setDegree] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')
    const [city, setCity] = useState('')
    const [country, setCountry] = useState('India')
    const [area, setArea] = useState('')
    const [pincode, setPincode] = useState('')
    const [available, setAvailable] = useState(true)
    const [existingImg, setExistingImg] = useState('')

    const { backendUrl } = useContext(AppContext)
    const { aToken, updateDoctor, doctors } = useContext(AdminContext)

    useEffect(() => {
        if (doctors.length > 0 && docId) {
            const doctor = doctors.find(doc => doc._id === docId)
            if (doctor) {
                setName(doctor.name)
                setEmail(doctor.email)
                setExperience(doctor.experience)
                setFees(doctor.fees)
                setAbout(doctor.about)
                setSpeciality(doctor.speciality)
                setDegree(doctor.degree)
                setAddress1(doctor.address?.line1 || '')
                setAddress2(doctor.address?.line2 || '')
                setCity(doctor.location?.city || '')
                setCountry(doctor.location?.country || 'India')
                setArea(doctor.location?.area || '')
                setPincode(doctor.location?.pincode || '')
                setAvailable(doctor.available)
                setExistingImg(doctor.image)
            }
        }
    }, [docId, doctors])

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {

            const formData = new FormData();

            if (docImg) {
                formData.append('image', docImg)
            }

            formData.append('docId', docId)
            formData.append('name', name)
            formData.append('email', email)
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about)
            formData.append('speciality', speciality)
            formData.append('degree', degree)
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))
            formData.append('location', JSON.stringify({ city, country, area, pincode }))
            formData.append('available', available)

            const success = await updateDoctor(formData)
            if (success) {
                navigate('/doctor-list')
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>

            <p className='mb-3 text-lg font-medium'>Edit Doctor</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor="doc-img">
                        <img className='w-16 h-16 object-cover bg-gray-100 rounded-full cursor-pointer' src={docImg ? URL.createObjectURL(docImg) : existingImg || assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" name="" id="doc-img" hidden />
                    <p>Update doctor <br /> picture</p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor name</p>
                            <input onChange={e => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Name' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor Email</p>
                            <input onChange={e => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Email' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Experience</p>
                            <select onChange={e => setExperience(e.target.value)} value={experience} className='border rounded px-2 py-2' >
                                <option value="1 Year">1 Year</option>
                                <option value="2 Year">2 Years</option>
                                <option value="3 Year">3 Years</option>
                                <option value="4 Year">4 Years</option>
                                <option value="5 Year">5 Years</option>
                                <option value="6 Year">6 Years</option>
                                <option value="8 Year">8 Years</option>
                                <option value="9 Year">9 Years</option>
                                <option value="10 Year">10 Years</option>
                            </select>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Fees</p>
                            <input onChange={e => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2' type="number" placeholder='Doctor fees' required />
                        </div>

                    </div>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Speciality</p>
                            <select onChange={e => setSpeciality(e.target.value)} value={speciality} className='border rounded px-2 py-2'>
                                <option value="General physician">General physician</option>
                                <option value="Gynecologist">Gynecologist</option>
                                <option value="Dermatologist">Dermatologist</option>
                                <option value="Pediatricians">Pediatricians</option>
                                <option value="Neurologist">Neurologist</option>
                                <option value="Gastroenterologist">Gastroenterologist</option>
                            </select>
                        </div>


                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Degree</p>
                            <input onChange={e => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2' type="text" placeholder='Degree' required />
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

                <div>
                    <p className='mt-4 mb-2'>About Doctor</p>
                    <textarea onChange={e => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' rows={5} placeholder='write about doctor'></textarea>
                </div>

                <div className='flex items-center gap-2 mt-4'>
                    <input type="checkbox" onChange={() => setAvailable(prev => !prev)} checked={available} id="doc-available" />
                    <label htmlFor="doc-available">Available</label>
                </div>

                <div className='flex gap-4 mt-6'>
                    <button type='submit' className='bg-primary px-10 py-3 text-white rounded-full hover:bg-primary-dark transition-all'>Save Changes</button>
                    <button type="button" onClick={() => navigate('/doctor-list')} className='bg-gray-100 px-10 py-3 text-gray-600 rounded-full hover:bg-gray-200 transition-all'>Cancel</button>
                </div>

            </div>


        </form>
    )
}

export default EditDoctor
