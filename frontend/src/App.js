// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register    from './components/Register';
import Login       from './components/Login';
import KeyExchange from './components/KeyExchange';
import Chat        from './components/Chat';
import AdminMonitor from './components/AdminMonitor';
import AdminLogin from './components/AdminLogin';

// Placeholder components for missing routes
const ForgotPassword = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Password Reset</h1>
      <p className="mb-4">This feature will be available soon.</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go Back
      </button>
    </div>
  </div>
);

const Terms = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="max-w-2xl p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <p className="mb-4">WALA secure messaging application terms of service...</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go Back
      </button>
    </div>
  </div>
);

const Privacy = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="max-w-2xl p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">WALA application privacy policy and data protection principles...</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go Back
      </button>
    </div>
  </div>
);

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Navigate to="/register" replace />} />
        <Route path="/register"      element={<Register/>} />
        <Route path="/login"         element={<Login/>} />
        <Route path="/exchange"      element={<KeyExchange/>} />
        <Route path="/chat"          element={<Chat/>} />
        <Route path="/admin-login"   element={<AdminLogin/>} />
        <Route path="/admin"         element={<AdminMonitor/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/terms"         element={<Terms/>} />
        <Route path="/privacy"       element={<Privacy/>} />
        {/* 404 Fallback */}
        <Route path="*"              element={<Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
