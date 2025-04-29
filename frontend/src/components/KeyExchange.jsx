import React, { useState } from 'react';
import { exchangeKey } from '../api';

export default function KeyExchange() {
  const username = localStorage.getItem('user') || '';
  const [encryptedKey, setEncryptedKey] = useState('');
  const [step, setStep] = useState(0); // 0 -> henüz Exchange edilmedi, 1 -> anahtar gösteriliyor

  const handleExchange = async () => {
    // 1) Backend’ten client publicKey ile şifreli DES anahtarını al
    const clientKey = localStorage.getItem('clientPublicKey');
    const res = await exchangeKey(username, clientKey);
    const enc = res.data.encrypted_des_key;
    // 2) Anahtarı ekranda tutmak için state’e set et
    setEncryptedKey(enc);
    setStep(1);
    // 3) localStorage’a da saklayalım, ama chat’e yönlendirmeyelim
    localStorage.setItem('encryptedSessionKey', enc);
  };

  const goToChat = () => {
    // Burada dilersen decrypt edip raw anahtarı saklayabilirsin
    // localStorage.setItem('sessionKeyRaw', decryptedBase64Key);
    // Sonra chat’e geç:
    window.location = '/chat';
  };

  return (
    <div>
      <h2>Exchange Session Key</h2>

      {step === 0 && (
        <button onClick={handleExchange}>Exchange</button>
      )}

      {step === 1 && (
        <>
          <p>Aşağıda gelen **RSA-şifreli** DES anahtarı. Lütfen kopyala ve 'Continue' ile devam et.</p>
          <textarea
            readOnly
            value={encryptedKey}
            rows={4}
            cols={60}
          />
          <br/>
          <button onClick={goToChat}>Continue to Chat</button>
        </>
      )}
    </div>
  );
}
