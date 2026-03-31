import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth.jsx'
import { Toaster } from 'react-hot-toast'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import JobsPage from './pages/JobsPage.jsx'
import JobDetailPage from './pages/JobDetailPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import MapPage from './pages/MapPage.jsx'
import ContentPage from './pages/ContentPage.jsx'
import SupportPage from './pages/SupportPage.jsx'

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
...
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
