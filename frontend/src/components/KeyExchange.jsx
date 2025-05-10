import React, { useState } from 'react';
import { exchangeKey } from '../api';
import { JSEncrypt } from 'jsencrypt';
import { Smartphone, Key, Lock, Shield, ArrowRight } from 'lucide-react';

export default function KeyExchange() {
  const user = localStorage.getItem('user');
  const [step, setStep] = useState(0);
  const [encDesKey, setEnc] = useState('');

  const doExchange = async () => {
    // mutlaka storage'da clientPublicKey var
    const pub = localStorage.getItem('clientPublicKey');
    console.log("POST /exchange_key", { username: user, client_rsa_public_key: pub });
    const res = await exchangeKey(user, pub);
    setEnc(res.data.encrypted_des_key);
    setStep(1);
  };

  const decryptAndContinue = () => {
    // RSA private key'in localStorage'da duruyor
    const crypt = new JSEncrypt();
    crypt.setPrivateKey(localStorage.getItem('privateKey'));
    // encrypted DES key'i decrypt et
    const rawBytes = crypt.decrypt(encDesKey);
    // raw bytes → Base64
    const rawB64 = window.btoa(rawBytes);
    localStorage.setItem('sessionKeyRaw', rawB64);
    window.location = '/chat';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center bg-green-500 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Mesajlaşma Uygulaması</h1>
          <p className="text-gray-500 text-center mt-2">Güvenli oturum anahtarı değişimi</p>
        </div>

        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">Oturum Anahtarı Değişimi</h2>
            <p className="text-gray-500 text-sm mt-2">Uçtan uca şifreli iletişim için anahtar değişimi yapılıyor</p>
          </div>
          
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Shield className="w-12 h-12 text-blue-500 mb-4" />
                <p className="text-gray-600 text-center mb-4">
                  Güvenli iletişim için sunucu ile oturum anahtarı değişimi gerekiyor. Devam etmek için anahtar değişimini başlatın.
                </p>
                <button
                  onClick={doExchange}
                  className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
                >
                  <Key className="w-5 h-5 mr-2" /> Anahtar Değişimini Başlat
                </button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Bu işlem, sunucu ile güvenli bir iletişim kanalı kurmak için gereklidir. Anahtarlarınız yerel cihazınızda güvenle saklanacaktır.
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
                      Anahtar değişimi başarılı! Şifreli oturum anahtarı alındı.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifrelenmiş Oturum Anahtarı</label>
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
                Anahtarı Çöz ve Sohbete Devam Et <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Anahtar çözme işlemi tamamen cihazınızda gerçekleştirilir ve asla sunucuya gönderilmez. Bu, mesajlarınızın güvenliğini sağlar.
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