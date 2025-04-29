import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000' });

export const register = (username, password, rsaKey) => API.post('/register', { username, password, rsa_public_key: rsaKey });
export const login = (username, password) => API.post('/login', { username, password });
export const exchangeKey = (username, clientKey) => API.post('/exchange_key', { username, client_rsa_public_key: clientKey });
export const sendMessage = (sender, recipient, encrypted, signature) =>
  API.post('/send_message', { sender, recipient, encrypted_message: encrypted, signature });
export const getMessages = (username) => API.get('/get_messages', { params: { username } });
export const adminUpdateRSA = (admin_password) => API.post('/admin/update_rsa', { admin_password });
export const adminMonitor = (token) => API.get('/admin/monitor', { params: { admin_token: token } });
