// frontend/src/components/KeyExchange.jsx
import React, { useState } from 'react';
import { exchangeKey } from '../api';
import { JSEncrypt }   from 'jsencrypt';

export default function KeyExchange() {
  const user = localStorage.getItem('user');
  const [step, setStep]     = useState(0);
  const [encDesKey, setEnc] = useState('');

  const doExchange = async () => {
    // mutlaka storage’da clientPublicKey var
    const pub = localStorage.getItem('clientPublicKey');
    console.log("POST /exchange_key", { username: user, client_rsa_public_key: pub });
    const res = await exchangeKey(user, pub);
    setEnc(res.data.encrypted_des_key);
    setStep(1);
  };

  const decryptAndContinue = () => {
    // RSA private key’in localStorage’da duruyor
    const crypt = new JSEncrypt();
    crypt.setPrivateKey(localStorage.getItem('privateKey'));
    // encrypted DES key’i decrypt et
    const rawBytes = crypt.decrypt(encDesKey);
    // raw bytes → Base64
    const rawB64   = window.btoa(rawBytes);
    localStorage.setItem('sessionKeyRaw', rawB64);
    window.location = '/chat';
  };

  return (
    <div style={{ padding:'2rem' }}>
      <h2>Exchange Session Key</h2>
      {step===0 && <button onClick={doExchange}>Exchange</button>}
      {step===1 && (
        <>
          <p style={{fontFamily:'monospace',whiteSpace:'pre-wrap'}}>{encDesKey}</p>
          <button onClick={decryptAndContinue}>
            Decrypt & Continue to Chat
          </button>
        </>
      )}
    </div>
  );
}
