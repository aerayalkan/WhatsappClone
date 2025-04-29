// frontend/src/components/Register.jsx
import React, { useState } from 'react';
import { register } from '../api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [publicKey, setPublicKey] = useState('');

  const handleSubmit = async () => {
    if (!publicKey.trim()) {
      alert("Lütfen PEM formatında public key'inizi yapıştırın.");
      return;
    }
    await register(username, password, publicKey);
    // Kullanıcı adını ve public key'i sakla
    localStorage.setItem('user', username);
    localStorage.setItem('clientPublicKey', publicKey);
    // Login ekranına yönlendir
    window.location = '/login';
  };

  return (
    <div>
      <h2>Register</h2>

      <label>
        RSA Public Key (PEM format):
        <br />
        <textarea
          value={publicKey}
          onChange={e => setPublicKey(e.target.value)}
          placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
          rows={6}
          cols={60}
        />
      </label>
      <br />

      <label>
        Username:
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
        />
      </label>
      <br />

      <label>
        Password:
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
        />
      </label>
      <br />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
