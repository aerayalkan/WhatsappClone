// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register    from './components/Register';
import Login       from './components/Login';
import KeyExchange from './components/KeyExchange';
import Chat        from './components/Chat';
import AdminMonitor from './components/AdminMonitor';

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/login"    element={<Login/>} />
        <Route path="/exchange" element={<KeyExchange/>} />
        <Route path="/chat"     element={<Chat/>} />
        <Route path="/admin"    element={<AdminMonitor/>} />
      </Routes>
    </BrowserRouter>
  );
}
