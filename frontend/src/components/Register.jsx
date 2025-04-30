import React, { useState } from 'react';
import { register }  from '../api';
import { JSEncrypt } from 'jsencrypt';

export default function Register() {
  const [user, setUser]     = useState('');
  const [pass, setPass]     = useState('');
  const [pubPEM, setPubPEM] = useState('');

  // Otomatik: tuşa basınca RSA key çifti tarayıcıda üretilir
  const generateKeys = () => {
    const crypt = new JSEncrypt({ default_key_size: 2048 });
    crypt.getKey();    
    const pub  = crypt.getPublicKey();   // PEM format public
    const priv = crypt.getPrivateKey();  // PEM format private
    setPubPEM(pub);
    localStorage.setItem('privateKey', priv);
  };

  const handleSubmit = async () => {
    if (!user||!pass||!pubPEM) {
      return alert('Generate Keys ve tüm alanları doldurun.');
    }
    // Backend’e kayıt
    await register(user, pass, pubPEM);
    // LocalStorage’a sakla
    localStorage.setItem('user', user);
    localStorage.setItem('clientPublicKey', pubPEM);
    // Login’e yönlendir
    window.location = '/login';
  };

  return (
    <div style={{padding:'2rem'}}>
      <h2>Register</h2>
      <button onClick={generateKeys}>Generate RSA Key Pair</button>
      <br/><br/>
      <textarea
        readOnly rows={6} cols={70}
        placeholder="Public Key PEM"
        value={pubPEM}
      />
      <br/><br/>
      <input
        placeholder="Username"
        value={user}
        onChange={e=>setUser(e.target.value)}
      /><br/><br/>
      <input
        placeholder="Password"
        type="password"
        value={pass}
        onChange={e=>setPass(e.target.value)}
      /><br/><br/>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
