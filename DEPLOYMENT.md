# WALA - Render.com Deployment Rehberi

Bu proje hem backend (Flask) hem frontend (React) içerir ve Render.com'da ayrı servisler olarak deploy edilir.

## 🚀 Deployment Adımları

### 1. GitHub'a Push Et
```bash
git add .
git commit -m "Deploy için hazırlık"
git push origin main
```

### 2. Render.com'da Account Oluştur
- [render.com](https://render.com) adresine git
- GitHub ile bağlan

### 3. Backend Deploy Et
1. Render.com'da "New +" → "Web Service"
2. GitHub repo'nu seç: `WALA`
3. Ayarlar:
   - **Name:** `wala-backend`
   - **Runtime:** `Python 3`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT detailed_backend:app`
   - **Plan:** Free

### 4. Frontend Deploy Et  
1. Render.com'da "New +" → "Static Site"
2. Aynı GitHub repo'nu seç: `WALA`
3. Ayarlar:
   - **Name:** `wala-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** Free

### 5. Environment Variables
Frontend servisinde Environment Variables ekle:
- `REACT_APP_API_URL` = `https://wala-backend.onrender.com`

## 📱 Kullanım

### Backend URL:
```
https://wala-backend.onrender.com
```

### Frontend URL:
```
https://wala-frontend.onrender.com
```

## ⚙️ Local Development

### Backend:
```bash
cd backend
pip install -r requirements.txt
python detailed_backend.py
```

### Frontend:
```bash
cd frontend
npm install
npm start
```

## 🔧 Troubleshooting

1. **Backend 503 hatası:** Free tier 15 dakika sonra uyuyor, ilk request biraz yavaş olabilir
2. **CORS hatası:** Backend'de CORS aktif, frontend'in doğru API URL'ini kullandığından emin ol
3. **Database hatası:** SQLite otomatik oluşuyor, migration gerekmez

## 🎯 Features

✅ RSA Şifreleme  
✅ DES Session Keys  
✅ Digital Signatures  
✅ Real-time Messaging  
✅ Admin Monitoring  
✅ Production Ready 