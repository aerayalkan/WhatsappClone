import React, { useState } from 'react';
import { register } from '../api';
import './Register.css'; // CSS dosyasını import ediyoruz

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Form doğrulama
    if (!username.trim()) {
      setError('Lütfen bir kullanıcı adı girin.');
      return;
    }
    
    if (!password.trim()) {
      setError('Lütfen bir şifre girin.');
      return;
    }
    
    if (!publicKey.trim()) {
      setError("Lütfen PEM formatında public key'inizi yapıştırın.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      await register(username, password, publicKey);
      
      // Kullanıcı adını ve public key'i sakla
      localStorage.setItem('user', username);
      localStorage.setItem('clientPublicKey', publicKey);
      
      // Login ekranına yönlendir
      window.location = '/login';
    } catch (err) {
      setError('Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('Kayıt hatası:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="whatsapp-container">
      <div className="whatsapp-card">
        <div className="logo-container">
          <div className="whatsapp-logo"></div>
        </div>
        
        <h2 className="title">Hesabınızı Oluşturun</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-container">
          <div className="input-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              className="whatsapp-input"
              disabled={isSubmitting}
            />
            <span className="input-hint">İstediğiniz zaman değiştirebilirsiniz</span>
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Güçlü bir şifre girin"
              className="whatsapp-input"
              disabled={isSubmitting}
            />
            <span className="input-hint">En az 8 karakter kullanın</span>
          </div>
          
          <div className="input-group">
            <label htmlFor="publicKey">RSA Public Key (PEM format)</label>
            <textarea
              id="publicKey"
              value={publicKey}
              onChange={e => setPublicKey(e.target.value)}
              placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
              rows={5}
              className="whatsapp-textarea"
              disabled={isSubmitting}
            />
            <span className="input-hint">Uçtan uca şifreleme için gereklidir</span>
          </div>
          
          <button 
            onClick={handleSubmit} 
            className="whatsapp-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'İşleniyor...' : 'Kaydol'}
          </button>
          
          <div className="login-link">
            Zaten bir hesabınız var mı? <a href="/login">Giriş Yap</a>
          </div>
        </div>
      </div>
    </div>
  );
}