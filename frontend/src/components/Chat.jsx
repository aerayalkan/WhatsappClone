import React, { useState, useEffect } from 'react';
import { getMessages, sendMessage } from '../api';
import CryptoJS from 'crypto-js';

export default function Chat() {
  const username = localStorage.getItem('user');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [msgs, setMsgs] = useState([]);
  const sessionKey = CryptoJS.enc.Base64.parse(localStorage.getItem('sessionKey'));

  useEffect(() => {
    fetchMsgs();
    // eslint-disable-next-line
  }, []);

  const fetchMsgs = async () => {
    const res = await getMessages(username);
    setMsgs(res.data.messages);
  };

  const handleSend = async () => {
    const encrypted = CryptoJS.DES.encrypt(message, sessionKey, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).toString();
    const signature = '';
    await sendMessage(username, recipient, encrypted, signature);
    setMessage('');
    fetchMsgs();
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Chat</h2>
      <input placeholder="Recipient" value={recipient} onChange={e => setRecipient(e.target.value)} />
      <br />
      <textarea rows={4} cols={60} value={message} onChange={e => setMessage(e.target.value)} />
      <br />
      <button onClick={handleSend}>Send</button>
      <ul>
        {msgs.map((m, i) => (
          <li key={i}>{m.sender}: {m.encrypted_message}</li>
        ))}
      </ul>
    </div>)
}