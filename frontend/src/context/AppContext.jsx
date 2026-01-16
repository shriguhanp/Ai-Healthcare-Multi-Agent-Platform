import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios'

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currencySymbol = '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')
    const [userData, setUserData] = useState(false)
    const [selectedCity, setSelectedCity] = useState(localStorage.getItem('userCity') || '')
    const [selectedCountry, setSelectedCountry] = useState(localStorage.getItem('userCountry') || 'India')
    const [hospitals, setHospitals] = useState([])

    // Getting Doctors using API
    const getDoctosData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // Search Doctors by Location
    const searchDoctorsByLocation = async (filters) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/search-doctors', filters)
            if (data.success) {
                return data.doctors
            } else {
                toast.error(data.message)
                return []
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            return []
        }
    }

    // Update selected city and save to localStorage
    const updateSelectedCity = (city) => {
        setSelectedCity(city)
        localStorage.setItem('userCity', city)
    }

    // Update selected country and save to localStorage
    const updateSelectedCountry = (country) => {
        setSelectedCountry(country)
        localStorage.setItem('userCountry', country)
    }

    // Getting User Profile using API
    const loadUserProfileData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })

            if (data.success) {
                setUserData(data.userData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const getAllHospitals = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/hospitals')
            if (data.success) {
                setHospitals(data.hospitals)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getDoctosData()
        getAllHospitals()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        }
    }, [token])

    const value = {
        doctors, getDoctosData,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData,
        selectedCity, updateSelectedCity,
        selectedCountry, updateSelectedCountry,
        searchDoctorsByLocation,
        hospitals
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider