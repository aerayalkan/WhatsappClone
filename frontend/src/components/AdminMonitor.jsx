import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminMonitor } from '../api';
import { Users, MessageSquare, Activity, Shield, LogOut } from 'lucide-react';

export default function AdminMonitor() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    load();
    // eslint-disable-next-line
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await adminMonitor(token);
      setData(res.data.data);
    } catch (err) {
      setError('Failed to load admin data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/admin-login')} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-500 text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100">System monitoring and statistics</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Users Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">Registered Users</h3>
                <p className="text-3xl font-bold text-blue-600">{data?.registered_users || 0}</p>
              </div>
            </div>
          </div>

          {/* Messages Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">Total Messages</h3>
                <p className="text-3xl font-bold text-green-600">{data?.total_messages || 0}</p>
              </div>
            </div>
          </div>

          {/* Active Sessions Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">Active Sessions</h3>
                <p className="text-3xl font-bold text-orange-600">{data?.active_sessions?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions List */}
        {data?.active_sessions && data.active_sessions.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Active User Sessions</h3>
            <div className="space-y-2">
              {data.active_sessions.map((session, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                  <Activity className="w-4 h-4 text-green-500 mr-3" />
                  <span className="font-mono text-sm">{session}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button 
            onClick={load}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}