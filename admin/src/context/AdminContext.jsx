import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";


import axios from "axios";
export const AdminContext = createContext()

const AdminContextProvider = ({ children }) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [hospitals, setHospitals] = useState([])
    const [dashData, setDashData] = useState(false)

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
                console.log("Doctors fetched:", data.doctors)
            } else {
                toast.error(data.message)
                console.error("Doctors fetch failed:", data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.error("Doctors fetch error:", error)
        }

    }

    // Getting all Hospitals data from Database using API
    const getAllHospitals = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/all-hospitals', { headers: { aToken } })
            if (data.success) {
                setHospitals(data.hospitals)
                console.log("Hospitals fetched:", data.hospitals)
            } else {
                toast.error(data.message)
                console.error("Hospitals fetch failed:", data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.error("Hospitals fetch error:", error)
        }
    }

    // Function to delete hospital using API
    const deleteHospital = async (id) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/delete-hospital', { id }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllHospitals()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to delete doctor using API
    const deleteDoctor = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/delete-doctor', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to update doctor info using API
    const updateDoctor = async (formData) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/update-doctor', formData, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            return false
        }
    }


    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const value = {
        aToken, setAToken,
        doctors,
        getAllDoctors,
        changeAvailability,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        dashData,
        deleteDoctor,
        updateDoctor,
        hospitals,
        getAllHospitals,
        deleteHospital
    }

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider