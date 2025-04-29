import React, { useState } from 'react';
import { login } from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    const res = await login(username, password);
    localStorage.setItem('user', username);
    localStorage.setItem('serverPublicKey', res.data.server_rsa_public_key);
    window.location = '/exchange';
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Login</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <br />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <br />
      <button onClick={handleSubmit}>Login</button>
    </div>
  );
}