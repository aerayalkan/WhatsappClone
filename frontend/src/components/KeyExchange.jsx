import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeKey } from '../api';
import { JSEncrypt } from 'jsencrypt';
import { Smartphone, Key, Lock, Shield, ArrowRight } from 'lucide-react';

export default function KeyExchange() {
  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const [step, setStep] = useState(0);
  const [encDesKey, setEnc] = useState('');

  const doExchange = async () => {
    try {
      // mutlaka storage'da clientPublicKey var
      const pub = localStorage.getItem('clientPublicKey');
      console.log("POST /exchange_key", { username: user, client_rsa_public_key: pub });
      const res = await exchangeKey(user, pub);
      setEnc(res.data.encrypted_des_key);
      setStep(1);
    } catch (error) {
      alert('An error occurred during key exchange: ' + (error.response?.data?.message || error.message));
    }
  };

  const decryptAndContinue = () => {
    try {
      // RSA private key'in localStorage'da duruyor
      const crypt = new JSEncrypt();
      crypt.setPrivateKey(localStorage.getItem('privateKey'));
      // encrypted DES key'i decrypt et
      const rawBytes = crypt.decrypt(encDesKey);
      // raw bytes → Base64
      const rawB64 = window.btoa(rawBytes);
      localStorage.setItem('sessionKeyRaw', rawB64);
      navigate('/chat');
    } catch (error) {
      alert('An error occurred during key decryption: ' + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center bg-green-500 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Messaging Application</h1>
          <p className="text-gray-500 text-center mt-2">Secure session key exchange</p>
        </div>

        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">Session Key Exchange</h2>
            <p className="text-gray-500 text-sm mt-2">Key exchange is being performed for end-to-end encrypted communication</p>
          </div>
          
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Shield className="w-12 h-12 text-blue-500 mb-4" />
                <p className="text-gray-600 text-center mb-4">
                  Session key exchange with the server is required for secure communication. Start the key exchange to continue.
                </p>
                <button
                  onClick={doExchange}
                  className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
                >
                  <Key className="w-5 h-5 mr-2" /> Start Key Exchange
                </button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      This process is required to establish a secure communication channel with the server. Your keys will be safely stored on your local device.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Key exchange successful! Encrypted session key received.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Encrypted Session Key</label>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full p-3 text-xs bg-gray-50 border border-gray-300 rounded-lg font-mono"
                  value={encDesKey}
                />
              </div>
              
              <button
                onClick={decryptAndContinue}
                className="w-full py-3 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition flex items-center justify-center"
              >
                Decrypt Key and Continue to Chat <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      The key decryption process is performed entirely on your device and is never sent to the server. This ensures the security of your messages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}