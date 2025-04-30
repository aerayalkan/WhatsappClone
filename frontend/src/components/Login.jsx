// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { login } from '../api';

export default function Login() {
  const [user,setUser] = useState('');
  const [pw, setPw]   = useState('');

  const submit = async () => {
    const res = await login(user, pw);
    // Backend’ten public key’leri alıp sakla
    localStorage.setItem('user', user);
    localStorage.setItem('serverPublicKey', res.data.server_rsa_public_key);
    localStorage.setItem('clientPublicKey', res.data.client_rsa_public_key);
    window.location = '/exchange';
  };

  return (
    <div style={{padding:'1rem'}}>
      <h2>Login</h2>
      <input placeholder="Username" value={user} onChange={e=>setUser(e.target.value)} /><br/>
      <input placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)} /><br/>
      <button onClick={submit}>Login</button>
    </div>
  );
}
