"""
File: detailed_backend.py

Bu dosya, CMSE-456/CMPE-455 Term Projesi için
"WhatsApp-Like Application" (WALA) backend uygulamasının
detaylı ve kapsamlı implementasyonunu içerir.

Özellikler:
- Client ve Sysadmin (Yönetici) actor’leri
- Kullanıcı kayıt ve giriş işlemleri (Şifreleme için hash kullanılmalı – 
  burada basit tutulmuştur)
- DES şifreleme ile mesajların şifrelenmiş halde veritabanında saklanması
- RSA ile oturum (session) anahtarının güvenli değişimi
- Dijital imza ile mesajların bütünlüğünün sağlanması ve doğrulanması
- Veritabanı olarak SQLite (SQLAlchemy kullanılarak)
- Sistem durumu ve güncel sunucu RSA anahtarlarının sysadmin tarafından kontrolü
- Periyodik RSA anahtar güncellemesi (arka plan thread’i ile)

Not: Bu kod örneği eğitim amaçlıdır. Gerçek uygulamada şifrelerin hashlenmesi,
token bazlı oturum yönetimi, hata yönetimi ve daha gelişmiş güvenlik önlemleri uygulanmalıdır.
"""

import os
import base64
import time
import threading
import logging
from datetime import datetime

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

from Crypto.Cipher import DES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256
from Crypto.Random import get_random_bytes

# Yapılandırma
app = Flask(__name__)
CORS(app)  # CORS desteği ekliyoruz (geliştirme aşamasında)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wala.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'patron_secret_key'  # Gerçek sistemde daha güçlü bir secret kullanın

# Veritabanı başlatma
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Logger ayarları
logging.basicConfig(level=logging.INFO)

#########################################
# DATABASE MODELS
#########################################

class User(db.Model):
    """
    Kullanıcı Modeli:
    - username: kullanıcı adı (benzersiz)
    - password: basit şekilde saklanan parola (Gerçek uygulamalarda hashlenmeli!)
    - rsa_public_key: Client'in RSA public anahtarı (PEM formatında)
    - created_at: Kayıt tarihi
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    rsa_public_key = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.username}>"

class Message(db.Model):
    """
    Mesaj Modeli:
    - sender: Mesajı gönderen kullanıcının kullanıcı adı
    - recipient: Mesajın alıcısı
    - encrypted_message: DES ile şifrelenmiş mesaj (base64 kodlanmış)
    - signature: Mesajın dijital imzası (base64 kodlanmış)
    - timestamp: Mesaj gönderim zamanı
    """
    id = db.Column(db.Integer, primary_key=True)
    sender = db.Column(db.String(80), nullable=False)
    recipient = db.Column(db.String(80), nullable=False)
    encrypted_message = db.Column(db.Text, nullable=False)
    signature = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Message from {self.sender} to {self.recipient}>"

# In-memory session keys: username -> DES key (8 byte)
session_keys = {}

#########################################
# GLOBAL RSA KEYLER (SUNUCU İÇİN)
#########################################

# Başlangıçta sunucunun RSA anahtarlarını oluşturuyoruz
def generate_server_rsa_keys():
    global server_rsa_key, server_rsa_public_key
    server_rsa_key = RSA.generate(2048)
    server_rsa_public_key = server_rsa_key.publickey().export_key().decode('utf-8')
    logging.info("Server RSA anahtarları güncellendi.")

generate_server_rsa_keys()

#########################################
# ENCRYPTION VE ŞİFRELEME YARDIMCI FONKSİYONLARI
#########################################

def pad(data: bytes) -> bytes:
    """DES için padding: Block boyutu 8 byte.
       Eksik kalan byte'lar uygun şekilde doldurulur."""
    padding_length = 8 - (len(data) % 8)
    return data + bytes([padding_length]) * padding_length

def unpad(data: bytes) -> bytes:
    """DES padding kaldırma fonksiyonu."""
    padding_length = data[-1]
    return data[:-padding_length]

def des_encrypt(key: bytes, data: bytes) -> str:
    """DES şifrelemesi; şifrelenmiş veriyi base64 string olarak döner."""
    cipher = DES.new(key, DES.MODE_ECB)
    padded_data = pad(data)
    encrypted_data = cipher.encrypt(padded_data)
    return base64.b64encode(encrypted_data).decode('utf-8')

def des_decrypt(key: bytes, enc_data_b64: str) -> bytes:
    """DES şifre çözme fonksiyonu."""
    encrypted_data = base64.b64decode(enc_data_b64)
    cipher = DES.new(key, DES.MODE_ECB)
    decrypted_padded_data = cipher.decrypt(encrypted_data)
    return unpad(decrypted_padded_data)

def rsa_encrypt(public_key_pem: str, data: bytes) -> str:
    """RSA şifrelemesi, verilen public key ile yapılır."""
    client_key = RSA.import_key(public_key_pem)
    cipher_rsa = PKCS1_OAEP.new(client_key)
    encrypted_data = cipher_rsa.encrypt(data)
    return base64.b64encode(encrypted_data).decode('utf-8')

def verify_signature(public_key_pem: str, data: bytes, signature_b64: str) -> bool:
    """
    Dijital imza doğrulaması:
    RSA public key ile data üzerinde SHA256 hash alınıp,
    imzanın doğruluğu kontrol edilir.
    """
    try:
        client_pub_key = RSA.import_key(public_key_pem)
        h = SHA256.new(data)
        signature = base64.b64decode(signature_b64)
        pkcs1_15.new(client_pub_key).verify(h, signature)
        return True
    except (ValueError, TypeError):
        return False

def sign_message(private_key: RSA.RsaKey, data: bytes) -> str:
    """
    Mesajı RSA private key ile imzalar ve base64 kodlu imzayı döner.
    (Bu fonksiyon, client ya da sunucu tarafından kullanılabilir.)
    """
    h = SHA256.new(data)
    signature = pkcs1_15.new(private_key).sign(h)
    return base64.b64encode(signature).decode('utf-8')

#########################################
# API ENDPOINTLERİ
#########################################

@app.route('/register', methods=['POST'])
def register():
    """
    Kullanıcı kayıt işlemi.
    Beklenen JSON verisi:
    {
       "username": "kullaniciAdi",
       "password": "parola",
       "rsa_public_key": "Client'in PEM formatındaki RSA public key'i"
    }
    Not: Gerçek sistemlerde şifreler hashlenerek saklanmalıdır.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    rsa_public_key = data.get('rsa_public_key')

    if not username or not password or not rsa_public_key:
        return jsonify({"status": "error", "message": "Gerekli tüm alanlar gönderilmelidir."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"status": "error", "message": "Kullanıcı zaten kayıtlı."}), 400

    new_user = User(username=username, password=password, rsa_public_key=rsa_public_key)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"status": "success", "message": f"{username} başarıyla kayıt oldu."}), 200

@app.route('/login', methods=['POST'])
def login():
    """
    Kullanıcı giriş işlemi.
    Beklenen JSON:
    {
       "username": "kullaniciAdi",
       "password": "parola"
    }
    Giriş başarılı olursa sunucunun güncel RSA public key'i de döner.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or user.password != password:
        return jsonify({"status": "error", "message": "Geçersiz kullanıcı adı veya şifre."}), 401

    response = {
        "status": "success",
        "message": f"{username} giriş yaptı.",
        "server_rsa_public_key": server_rsa_public_key
    }
    return jsonify(response), 200

@app.route('/exchange_key', methods=['POST'])
def exchange_key():
    """
    Oturum (session) anahtarının değişimi:
    Client, kendi RSA public key'ini gönderir.
    Sunucu, rasgele 8 byte'lık DES anahtarı oluşturur, bunu
    client'in RSA public key'i ile şifreleyerek (RSA encryption)
    client'e gönderir.
    
    Beklenen JSON:
    {
       "username": "kullaniciAdi",
       "client_rsa_public_key": "Client'in PEM formatında RSA public key'i"
    }
    """
    data = request.get_json()
    username = data.get('username')
    client_rsa_public_key = data.get('client_rsa_public_key')

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"status": "error", "message": "Kullanıcı bulunamadı."}), 404

    # DES anahtarının 8 byte olması gerekmektedir.
    des_key = get_random_bytes(8)
    session_keys[username] = des_key

    # DES anahtarını client'in RSA public key'i ile şifrele
    encrypted_des_key = rsa_encrypt(client_rsa_public_key, des_key)
    return jsonify({"status": "success", "encrypted_des_key": encrypted_des_key}), 200

@app.route('/send_message', methods=['POST'])
def send_message():
    """
    Mesaj gönderme endpoint'i.
    Beklenen JSON:
    {
        "sender": "gönderenKullanici",
        "recipient": "aliciKullanici",
        "encrypted_message": "DES ile şifrelenmiş, base64 kodlanmış mesaj",
        "signature": "Mesajın gönderici tarafından oluşturulan dijital imzası (base64)"
    }
    Server, mesajı almadan önce göndericinin RSA public key'i üzerinden dijital imzanın
    doğruluğunu kontrol eder.
    """
    data = request.get_json()
    sender = data.get('sender')
    recipient = data.get('recipient')
    encrypted_message = data.get('encrypted_message')
    signature = data.get('signature')

    if not sender or not recipient or not encrypted_message or not signature:
        return jsonify({"status": "error", "message": "Tüm alanlar gönderilmelidir."}), 400

    sender_user = User.query.filter_by(username=sender).first()
    recipient_user = User.query.filter_by(username=recipient).first()

    if not sender_user:
        return jsonify({"status": "error", "message": "Gönderen kullanıcı bulunamadı."}), 404
    if not recipient_user:
        return jsonify({"status": "error", "message": "Alıcı kullanıcı bulunamadı."}), 404

    # Dijital imza doğrulaması: Burada imza, DES şifreli mesajın base64 kodlanmış halinden üretilmiş olsun.
    if not verify_signature(sender_user.rsa_public_key, encrypted_message.encode('utf-8'), signature):
        return jsonify({"status": "error", "message": "İmza doğrulaması başarısız."}), 400

    new_message = Message(sender=sender,
                          recipient=recipient,
                          encrypted_message=encrypted_message,
                          signature=signature)
    db.session.add(new_message)
    db.session.commit()
    return jsonify({"status": "success", "message": "Mesaj gönderildi."}), 200

@app.route('/get_messages', methods=['GET'])
def get_messages():
    """
    Belirtilen kullanıcı için tüm mesajları döner.
    Query parametreleri: username
    Mesajlar DES ile şifrelenmiş halde veritabanından çekilir.
    """
    username = request.args.get('username')
    if not username:
        return jsonify({"status": "error", "message": "Kullanıcı adı belirtilmelidir."}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"status": "error", "message": "Kullanıcı bulunamadı."}), 404

    messages = Message.query.filter_by(recipient=username).all()
    message_list = [{
        "sender": msg.sender,
        "recipient": msg.recipient,
        "encrypted_message": msg.encrypted_message,
        "signature": msg.signature,
        "timestamp": msg.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    } for msg in messages]

    return jsonify({"status": "success", "messages": message_list}), 200

#########################################
# SYSADMIN (YÖNETİCİ) ENDPOINTLERİ
#########################################

@app.route('/admin/update_rsa', methods=['POST'])
def admin_update_rsa():
    """
    Sysadmin'in, sunucunun RSA anahtarlarını güncellemesi için endpoint.
    Beklenen JSON:
    {
       "admin_password": "yöneticiParolasi"
    }
    Gerçek uygulamada daha güvenli kimlik doğrulama mekanizması kullanılmalıdır.
    """
    data = request.get_json()
    admin_password = data.get('admin_password')
    
    # Örnek admin doğrulaması
    if admin_password != "admin123":
        return jsonify({"status": "error", "message": "Yetkisiz erişim."}), 401

    generate_server_rsa_keys()
    return jsonify({
        "status": "success",
        "message": "RSA anahtarları güncellendi.",
        "server_rsa_public_key": server_rsa_public_key
    }), 200

@app.route('/admin/monitor', methods=['GET'])
def admin_monitor():
    """
    Sysadmin'e ait monitoring endpoint'i.
    admin_token parametresi (query) ile basit kontrol yapılır.
    Dönen bilgiler: 
    - Kayıtlı kullanıcı sayısı
    - Toplam mesaj sayısı
    - Aktif oturum (session) bilgileri
    """
    admin_token = request.args.get('admin_token')
    if admin_token != "admin_token_example":
        return jsonify({"status": "error", "message": "Yetkisiz erişim."}), 401

    registered_users = User.query.count()
    total_messages = Message.query.count()
    active_sessions = list(session_keys.keys())

    data = {
        "registered_users": registered_users,
        "total_messages": total_messages,
        "active_sessions": active_sessions
    }
    return jsonify({"status": "success", "data": data}), 200

#########################################
# PERİYODİK RSA ANAHTAR GÜNCELLEMESİ (ARKA PLAN THREAD)
#########################################

def periodic_rsa_update(interval=600):
    """
    600 saniyede (10 dakikada) bir sunucunun RSA anahtarlarını güncelleyen fonksiyon.
    Patron, bu süreyi ihtiyaca göre ayarlayabilirsiniz.
    """
    while True:
        time.sleep(interval)
        generate_server_rsa_keys()

# Arka plan thread'ini başlatıyoruz (daemon olarak çalışır)
update_thread = threading.Thread(target=periodic_rsa_update, args=(600,), daemon=True)
update_thread.start()

#########################################
# UYGULAMA BAŞLANGICI
#########################################

if __name__ == '__main__':
    # Debug modunda çalıştırıyoruz, üretim ortamı için farklı yapılandırma gerekebilir.
    app.run(host='0.0.0.0', port=5000, debug=True)
