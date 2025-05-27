// frontend/src/api.js
import axios from 'axios';

// Backend'in çalıştığı adres
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',  
});

export const register = (username, password, publicKey) =>
  api.post('/register', {
    username,
    password,
    rsa_public_key: publicKey    // backend beklediği alan adı
  });

export const login = (username, password) =>
  api.post('/login', { username, password });

export const exchangeKey = (username, clientKey) =>
  api.post('/exchange_key', {
    username,
    client_rsa_public_key: clientKey  // backend beklediği alan adı
  });

export const sendMessage = (sender, recipient, encrypted_message, signature) =>
  api.post('/send_message', { sender, recipient, encrypted_message, signature });

export const getMessages = (username) =>
  api.get('/get_messages', { params: { username } });

export const adminMonitor = (admin_token) =>
  api.get('/admin/monitor', { params: { admin_token } });
