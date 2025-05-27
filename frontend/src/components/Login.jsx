import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { Smartphone, Lock, User } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [pw, setPw] = useState('');

  const submit = async () => {
    try {
      const res = await login(user, pw);
      // Backend'ten public key'leri alıp sakla
      localStorage.setItem('user', user);
      localStorage.setItem('serverPublicKey', res.data.server_rsa_public_key);
      localStorage.setItem('clientPublicKey', res.data.client_rsa_public_key);
      navigate('/exchange');
    } catch (error) {
      alert('An error occurred during login: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center bg-green-500 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Messaging Application</h1>
          <p className="text-gray-500 text-center mt-2">Sign in to your account</p>
        </div>

        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">Sign In</h2>
            <p className="text-gray-500 text-sm mt-2">Access your account for secure communication</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={submit}
            className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
          >
            Sign In
          </button>
          
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => navigate('/forgot-password')} className="text-sm text-blue-500 hover:underline bg-transparent border-none cursor-pointer p-0">Forgot your password?</button>
            <button onClick={() => navigate('/register')} className="text-sm text-blue-500 hover:underline bg-transparent border-none cursor-pointer p-0">Create account</button>
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            By signing in, you agree to our <button onClick={() => navigate('/terms')} className="text-sm text-blue-500 hover:underline bg-transparent border-none cursor-pointer p-0">terms of service</button> and 
            <button onClick={() => navigate('/privacy')} className="text-sm text-blue-500 hover:underline bg-transparent border-none cursor-pointer p-0">privacy policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}