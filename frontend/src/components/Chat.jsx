import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMessages, sendMessage } from '../api';
import CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';
import { Send, Menu, User, MessageSquare, RefreshCw } from 'lucide-react';

export default function Chat() {
  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const rawB64 = localStorage.getItem('sessionKeyRaw');
  useEffect(() => { if (!rawB64) navigate('/exchange'); }, [rawB64, navigate]);
  const sessionKey = rawB64 && CryptoJS.enc.Base64.parse(rawB64);

  const [to, setTo] = useState('');
  const [msg, setMsg] = useState('');
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastFetchTime = useRef(0);
  const fetchTimeoutRef = useRef(null);

  // Rate limited fetch - minimum 2 saniye ara ile çalışır
  const fetchMsgs = useCallback(async (force = false) => {
    if (!sessionKey || !user) return;
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    // Force değilse ve 5 saniyeden az geçtiyse, fetch yapma
    if (!force && timeSinceLastFetch < 5000) {
      console.log('Rate limit: Too early fetch attempt, skipping');
      return;
    }
    
    // Zaten yükleniyor mu kontrol et
    if (isLoading) {
      console.log('Already loading, skipping');
      return;
    }
    
    lastFetchTime.current = now;
    setIsLoading(true);
    
    try {
      const res = await getMessages(user);
      const messages = res.data.messages.map(m => {
        const dec = CryptoJS.DES.decrypt(m.encrypted_message, sessionKey, {
          mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);
        return { sender: m.sender, recipient: m.recipient, text: dec, timestamp: m.timestamp };
      });
      
      // Sadece mesajlar gerçekten değiştiyse güncelle
      const messagesJson = JSON.stringify(messages);
      const currentJson = JSON.stringify(list);
      
      if (messagesJson !== currentJson) {
        const hasNewMessages = messages.length > list.length;
        setList(messages);
        setLastUpdate(new Date());
        
        if (hasNewMessages) {
          // Kullanıcı en altta mı kontrol et
          const container = messagesContainerRef.current;
          if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
            if (isAtBottom) {
              setShouldScrollToBottom(true);
            }
          } else {
            // İlk yüklemede her zaman scroll yap
            setShouldScrollToBottom(true);
          }
        }
             } else {
         // Mesajlar aynıysa sadece son güncelleme zamanını güncelle
         setLastUpdate(new Date());
       }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Network error durumunda daha uzun bekle
      if (error.code === 'ERR_NETWORK') {
        console.log('Network error - next fetch in 10 seconds');
        lastFetchTime.current = now + 8000; // 10 saniye daha beklet
      }
      
      // 404 hatası durumunda boş array set et
      if (error.response?.status === 404) {
        console.log('User not found, showing empty message list');
        setList([]);
      } else {
        // Diğer hatalar için de boş array
        setList([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionKey, user]); // Sadece temel dependency'ler

  // İlk yükleme ve çok seyrek otomatik yenileme
  useEffect(() => {
    if (!sessionKey || !user) return;
    
    setShouldScrollToBottom(true); // İlk yüklemede scroll yap
    fetchMsgs(true); // İlk yükleme (force=true)
    
    // Çok seyrek otomatik yenileme - sadece background işlem
    const interval = setInterval(() => {
      if (!document.hidden && !isLoading) { // Sayfa aktifse ve yüklenmiyorsa
        fetchMsgs();
      }
    }, 60000); // 60 saniyede bir (çok seyrek)
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [sessionKey, user]); // fetchMsgs'i dependency'den çıkardık

  // Sadece shouldScrollToBottom true olduğunda scroll yap
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom]);

  // Mesajı DES+RSA imza ile gönder
  const send = async () => {
    if (!to || !msg) return;
    const enc = CryptoJS.DES.encrypt(msg, sessionKey, {
      mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7
    }).toString();
    // imza
    const signer = new JSEncrypt();
    signer.setPrivateKey(localStorage.getItem('privateKey'));
    const sig = signer.sign(enc, CryptoJS.SHA256, 'sha256');

    // 🔐 Encryption işlemine dokunmuyoruz, sadece payload'u logluyoruz
    console.log("🔐 Gönderilen payload:", {
      sender: user,
      recipient: to,
      encrypted_message: enc,
      signature: sig
    });

    try {
      await sendMessage(user, to, enc, sig);
      setMsg('');
      // Mesaj gönderildikten sonra scroll yap ve yenile
      setShouldScrollToBottom(true);
      setTimeout(() => fetchMsgs(true), 1000); // Force=true ile 1 saniye sonra
    } catch (err) {
      console.error("❌ send_message error:", err.response?.data || err);
      alert(`Message could not be sent: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Manuel refresh butonu - rate limiting ile
  const handleRefresh = () => {
    if (!isLoading) {
      fetchMsgs();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center mr-3">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-medium">Messaging Application</h1>
          <p className="text-xs">
            Secure communication platform - {user}
            {lastUpdate && (
              <span className="ml-2 text-green-200">
                • Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-full hover:bg-green-600 mr-2"
        >
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button className="p-1 rounded-full hover:bg-green-600">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Recipient Input */}
        <div className="bg-white p-4 shadow-sm">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Recipient username"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        
        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-2">
          {list.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
                <p className="text-sm mt-2">
                  Messages refresh manually (↻ button)
                  {isLoading && <span className="animate-pulse"> • Loading...</span>}
                </p>
              </div>
            </div>
          ) : (
            list.map((m, i) => (
              <div 
                key={i} 
                className={`flex ${m.sender === user ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md p-3 rounded-lg relative ${
                    m.sender === user 
                      ? 'bg-green-100 rounded-tr-none' 
                      : 'bg-white rounded-tl-none'
                  }`}>
                  <div className="text-xs text-gray-500 mb-1">
                    {m.sender === user ? `You → ${m.recipient}` : `${m.sender} → You`}
                  </div>
                  <p className="break-words">{m.text}</p>
                  <span className="text-xs text-gray-500 text-right block mt-1">
                    {formatTime(m.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-gray-50 p-3 border-t">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-white rounded-full border border-gray-300 overflow-hidden flex items-center">
              <textarea
                rows="1"
                placeholder="Write a message..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 py-2 px-4 focus:outline-none resize-none"
              />
            </div>
            <button 
              onClick={send}
              disabled={!msg.trim() || !to.trim()}
              className={`p-3 rounded-full ${
                msg.trim() && to.trim() ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'
              }`}
            >
              <Send className={`h-5 w-5 ${msg.trim() && to.trim() ? 'text-white' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}