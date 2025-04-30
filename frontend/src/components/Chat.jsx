// frontend/src/components/Chat.jsx
import React, { useState, useEffect } from 'react';
import { getMessages, sendMessage } from '../api';
import CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';

export default function Chat() {
  const user = localStorage.getItem('user');
  const rawB64 = localStorage.getItem('sessionKeyRaw');
  useEffect(() => { if (!rawB64) window.location = '/exchange'; }, [rawB64]);
  const sessionKey = rawB64 && CryptoJS.enc.Base64.parse(rawB64);

  const [to, setTo] = useState('');
  const [msg, setMsg] = useState('');
  const [list, setList] = useState([]);

  // Gelen mesajları DES çöz, göster
  const fetchMsgs = async () => {
    const res = await getMessages(user);
    setList(res.data.messages.map(m=>{
      const dec = CryptoJS.DES.decrypt(m.encrypted_message, sessionKey, {
        mode:CryptoJS.mode.ECB, padding:CryptoJS.pad.Pkcs7
      }).toString(CryptoJS.enc.Utf8);
      return { sender:m.sender, text:dec, timestamp:m.timestamp };
    }));
  };

  useEffect(()=>{ if(sessionKey) fetchMsgs(); },[sessionKey]);

  // Mesajı DES+RSA imza ile gönder
  const send = async () => {
    if(!to||!msg) return;
    const enc = CryptoJS.DES.encrypt(msg, sessionKey, {
      mode:CryptoJS.mode.ECB, padding:CryptoJS.pad.Pkcs7
    }).toString();
    // imza
    const signer = new JSEncrypt();
    signer.setPrivateKey(localStorage.getItem('privateKey'));
    const sig = signer.sign(enc, CryptoJS.SHA256, 'sha256');
    await sendMessage(user, to, enc, sig);
    setMsg(''); fetchMsgs();
  };

  return (
    <div style={{padding:'1rem'}}>
      <h2>Chat</h2>
      <input value={to} onChange={e=>setTo(e.target.value)} placeholder="recipient" /><br/>
      <textarea rows={3} cols={60} value={msg} onChange={e=>setMsg(e.target.value)} /><br/>
      <button onClick={send}>Send</button>
      <h3>Messages</h3>
      <ul>
        {list.map((m,i)=>(
          <li key={i}>
            <b>{m.sender}</b> [{m.timestamp}]: {m.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
