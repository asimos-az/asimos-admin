import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '../lib/auth'

export default function RequireAuth({ children }){
  const loc = useLocation()
  const token = getToken()
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return children
}
