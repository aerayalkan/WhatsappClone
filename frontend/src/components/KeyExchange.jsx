import React, { useState } from 'react';
import { exchangeKey } from '../api';

export default function KeyExchange() {
  const username = localStorage.getItem('user') || '';
  const [encryptedKey, setEncryptedKey] = useState('');

  const handleExchange = async () => {
    const clientKey = localStorage.getItem('privateKey');
    const res = await exchangeKey(username, clientKey);
    setEncryptedKey(res.data.encrypted_des_key);
    localStorage.setItem('sessionKey', res.data.encrypted_des_key);
    window.location = '/chat';
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Exchange Session Key</h2>
      <button onClick={handleExchange}>Exchange</button>
      <br />
      <textarea readOnly value={encryptedKey} rows={4} cols={60} />
    </div>
  );
}