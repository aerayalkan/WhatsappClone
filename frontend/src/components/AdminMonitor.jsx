import React, { useState, useEffect } from 'react';
import { adminMonitor } from '../api';

export default function AdminMonitor() {
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const load = async () => {
    const res = await adminMonitor('admin_token_example');
    setData(res.data.data);
  };

  if (!data) return <div>Loading...</div>;
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Admin Monitor</h2>
      <p>Users: {data.registered_users}</p>
      <p>Messages: {data.total_messages}</p>
      <p>Sessions: {data.active_sessions.join(', ')}</p>
    </div>
  )
}