import React, { useState } from 'react';
import { register } from '../api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [publicKey, setPublicKey] = useState('');

  const handleSubmit = async () => {
    if (!publicKey.trim()) {
      alert('Please paste your RSA public key in PEM format.');
      return;
    }
    await register(username, password, publicKey);
    localStorage.setItem('user', username);
    window.location = '/login';
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Register</h2>
      <textarea
        placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
        value={publicKey}
        onChange={e => setPublicKey(e.target.value)}
        rows={6}
        cols={60}
      />
      <br />
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <br />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <br />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}