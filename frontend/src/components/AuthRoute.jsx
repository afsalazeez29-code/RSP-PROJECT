import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUtensils } from "react-icons/fa";

const AuthRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(5,5,5,0.98) 0%, rgba(10,18,10,0.99) 100%)',
      }}>
        <div style={{ textAlign: 'center', color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#fff' }}><FaUtensils /></div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect away from auth pages
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Otherwise, allow access to login/register pages
  return <Outlet />;
};

export default AuthRoute;
