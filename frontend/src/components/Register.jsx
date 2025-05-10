import { JSEncrypt } from 'jsencrypt'; // RSA anahtar çifti oluşturmak için
import React, { useState } from 'react';
import { register } from '../api'; // API'den register fonksiyonunu import et
import { Smartphone, Lock, User, Shield, CheckCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [pubPEM, setPubPEM] = useState('');
  const [keyGenerated, setKeyGenerated] = useState(false);
  const [step, setStep] = useState(1);

  // Otomatik: tuşa basınca RSA key çifti tarayıcıda üretilir
  const generateKeys = () => {
    const crypt = new JSEncrypt({ default_key_size: 2048 });
    crypt.getKey();
    const pub = crypt.getPublicKey(); // PEM format public
    const priv = crypt.getPrivateKey(); // PEM format private
    setPubPEM(pub);
    localStorage.setItem('privateKey', priv);
    setKeyGenerated(true);
    setTimeout(() => setStep(2), 1000);
  };

  const handleSubmit = async () => {
    if (!user || !pass || !pubPEM) {
      return alert('Lütfen önce anahtar oluşturun ve tüm alanları doldurun.');
    }
    // Backend'e kayıt
    await register(user, pass, pubPEM);
    // LocalStorage'a sakla
    localStorage.setItem('user', user);
    localStorage.setItem('clientPublicKey', pubPEM);
    // Login'e yönlendir
    window.location = '/login';
  };

  const nextStep = () => {
    if (step === 2 && (!user || !pass)) {
      return alert('Lütfen kullanıcı adı ve şifre alanlarını doldurun.');
    }
    setStep(step + 1);
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
          <p className="text-gray-500 text-center mt-2">Güvenli iletişim için hesap oluşturun</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-between mb-8 relative">
          <div className="w-full absolute top-1/2 h-0.5 bg-gray-200"></div>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${
              s < step ? 'bg-green-500' : s === step ? 'bg-blue-500' : 'bg-gray-200'
            }`}>
              {s < step ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <span className="text-white font-medium">{s}</span>
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Güvenlik Anahtarı Oluşturun</h2>
              <p className="text-gray-500 text-sm mt-2">Mesajlarınızın güvenliği için RSA anahtar çifti gereklidir</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <Shield className="w-12 h-12 text-blue-500 mb-4" />
              <p className="text-gray-600 text-center mb-4">
                İletişiminizi korumak için güvenli bir anahtar oluşturun
              </p>
              <button
                onClick={generateKeys}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition ${
                  keyGenerated 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={keyGenerated}
              >
                {keyGenerated ? (
                  <span className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" /> Anahtar Oluşturuldu
                  </span>
                ) : (
                  'RSA Anahtar Çifti Oluştur'
                )}
              </button>
            </div>

            {pubPEM && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Oluşturulan Genel Anahtar</label>
                <textarea
                  readOnly
                  rows={3}
                  className="w-full p-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={pubPEM}
                />
              </div>
            )}

            {keyGenerated && (
              <div className="flex justify-end">
                <button 
                  onClick={nextStep}
                  className="flex items-center justify-center py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  İleri <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Hesap Bilgileriniz</h2>
              <p className="text-gray-500 text-sm mt-2">Hesabınıza erişmek için gereken bilgileri girin</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Kullanıcı adınızı girin"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="Güvenli bir şifre oluşturun"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={nextStep}
                className="flex items-center justify-center py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                disabled={!user || !pass}
              >
                İleri <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Kayıt İşlemini Tamamlayın</h2>
              <p className="text-gray-500 text-sm mt-2">Tüm bilgilerinizi kontrol edin ve hesabınızı oluşturun</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-3">Hesap Bilgileriniz</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kullanıcı Adı:</span>
                  <span className="font-medium">{user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Şifre:</span>
                  <span className="font-medium">••••••••</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Güvenlik Anahtarı:</span>
                  <span className="font-medium text-green-500">Oluşturuldu</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Mesajlarınız uçtan uca şifreleme ile korunacaktır. Gizliliğiniz bizim için önemlidir.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition flex items-center justify-center"
            >
              Hesabı Oluştur <CheckCircle className="ml-2 w-5 h-5" />
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Kayıt olarak, <a href="#" className="text-blue-500 hover:underline">kullanım koşullarını</a> ve 
              <a href="#" className="text-blue-500 hover:underline"> gizlilik politikasını</a> kabul etmiş olursunuz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}