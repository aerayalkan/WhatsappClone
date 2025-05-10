import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage } from '../api';
import CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';
import { Send, Menu, User, MessageSquare } from 'lucide-react';

export default function Chat() {
  const user = localStorage.getItem('user');
  const rawB64 = localStorage.getItem('sessionKeyRaw');
  useEffect(() => { if (!rawB64) window.location = '/exchange'; }, [rawB64]);
  const sessionKey = rawB64 && CryptoJS.enc.Base64.parse(rawB64);

  const [to, setTo] = useState('');
  const [msg, setMsg] = useState('');
  const [list, setList] = useState([]);
  const messagesEndRef = useRef(null);

  // Gelen mesajları DES çöz, göster
  const fetchMsgs = async () => {
    const res = await getMessages(user);
    const messages = res.data.messages.map(m => {
      const dec = CryptoJS.DES.decrypt(m.encrypted_message, sessionKey, {
        mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7
      }).toString(CryptoJS.enc.Utf8);
      return { sender: m.sender, recipient: m.recipient, text: dec, timestamp: m.timestamp };
    });
    setList(messages);
  };

  useEffect(() => { 
    if (sessionKey) fetchMsgs(); 
  }, [sessionKey]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [list]);

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
    await sendMessage(user, to, enc, sig);
    setMsg('');
    fetchMsgs();
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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center mr-3">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-medium">Mesajlaşma Uygulaması</h1>
          <p className="text-xs">Güvenli iletişim platformu</p>
        </div>
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
              placeholder="Alıcı kullanıcı adı"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-2">
          {list.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Henüz mesaj yok. Konuşmaya başlayın!
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
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {m.sender === user ? `Sen → ${m.recipient}` : m.sender}
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
                placeholder="Mesaj yazın..."
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