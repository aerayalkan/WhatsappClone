import React from 'react';
import ReactDOM from 'react-dom/client';
// **CSS import’u tamamen kaldırıyoruz**, çünkü artık CDN’den geliyor.
// import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
