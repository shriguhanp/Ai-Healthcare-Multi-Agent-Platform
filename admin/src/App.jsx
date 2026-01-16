import React, { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import EditDoctor from './pages/Admin/EditDoctor';
import AddHospital from './pages/Admin/AddHospital';
import HospitalList from './pages/Admin/HospitalList';
import Login from './pages/Login';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import Patients from './pages/Doctor/Patients';
import DoctorChat from './pages/Doctor/DoctorChat';
import Prescriptions from './pages/Doctor/Prescriptions';
import { DoctorChatContextProvider } from './context/DoctorChatContext';

const App = () => {

  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)

  return (
    <div className='bg-[#F8F9FD] min-h-screen'>
      <ToastContainer />
      {(dToken || aToken) ? (
        <>
          <Navbar />
          <div className='flex items-start'>
            <Sidebar />
            <Routes>
              <Route path='/' element={<></>} />
              <Route path='/admin-dashboard' element={<Dashboard />} />
              <Route path='/all-appointments' element={<AllAppointments />} />
              <Route path='/add-doctor' element={<AddDoctor />} />
              <Route path='/doctor-list' element={<DoctorsList />} />
              <Route path='/edit-doctor/:docId' element={<EditDoctor />} />
              <Route path='/add-hospital' element={<AddHospital />} />
              <Route path='/hospital-list' element={<HospitalList />} />
              <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
              <Route path='/doctor-appointments' element={<DoctorAppointments />} />
              <Route path='/doctor-patients' element={<Patients />} />
              <Route path='/doctor-prescriptions' element={<Prescriptions />} />
              <Route path='/doctor-profile' element={<DoctorProfile />} />
              <Route
                path='/doctor-chat'
                element={dToken ? <DoctorChatContextProvider><DoctorChat /></DoctorChatContextProvider> : <div className='p-5'>Access Denied</div>}
              />
              <Route
                path='/doctor-chat/:partnerId'
                element={dToken ? <DoctorChatContextProvider><DoctorChat /></DoctorChatContextProvider> : <div className='p-5'>Access Denied</div>}
              />
            </Routes>
          </div>
        </>
      ) : (
        <Login />
      )}
    </div>
  )
}

export default App