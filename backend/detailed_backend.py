"""
File: detailed_backend.py

Bu dosya, CMSE-456/CMPE-455 Term Projesi için
"WhatsApp-Like Application" (WALA) backend uygulamasının
detaylı ve kapsamlı implementasyonunu içerir.
"""

import base64
import time
import threading
import logging
import hashlib
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

# --- UYGULAMA & DB KONFİGÜRASYÖNÜ ---
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wala.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'patron_secret_key'

db = SQLAlchemy(app)
migrate = Migrate(app, db)
logging.basicConfig(level=logging.INFO)

# --- MODEL TANIMLARI ---
class User(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    username       = db.Column(db.String(80), unique=True, nullable=False)
    password       = db.Column(db.String(128), nullable=False)
    rsa_public_key = db.Column(db.Text, nullable=False)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.username}>"

class Message(db.Model):
    id                = db.Column(db.Integer, primary_key=True)
    sender            = db.Column(db.String(80), nullable=False)
    recipient         = db.Column(db.String(80), nullable=False)
    encrypted_message = db.Column(db.Text, nullable=False)
    signature         = db.Column(db.Text, nullable=False)
    timestamp         = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Message {self.sender}->{self.recipient}>"

# In-memory depolama: kullanıcı adı -> DES anahtarı
session_keys = {}

# --- SERVER RSA ANAHTARLARI ---
def generate_server_rsa_keys():
    global server_rsa_key, server_rsa_public_key
    server_rsa_key        = RSA.generate(2048)
    server_rsa_public_key = server_rsa_key.publickey().export_key().decode('utf-8')
    logging.info("Server RSA anahtarları güncellendi.")

generate_server_rsa_keys()

# --- KRIPTO YARDIMCI FONKSIYONLAR ---
def hash_password(password: str) -> str:
    """Şifreyi SHA256 ile hashle"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Şifreyi doğrula"""
    return hash_password(password) == hashed
def pad(data: bytes) -> bytes:
    pad_len = 8 - (len(data) % 8)
    return data + bytes([pad_len]) * pad_len

def unpad(data: bytes) -> bytes:
    pad_len = data[-1]
    return data[:-pad_len]

def des_encrypt(key: bytes, data: bytes) -> str:
    cipher = DES.new(key, DES.MODE_ECB)
    enc    = cipher.encrypt(pad(data))
    return base64.b64encode(enc).decode('utf-8')

def des_decrypt(key: bytes, enc_b64: str) -> bytes:
    data = base64.b64decode(enc_b64)
    cipher = DES.new(key, DES.MODE_ECB)
    return unpad(cipher.decrypt(data))

def rsa_encrypt(public_pem: str, data: bytes) -> str:
    pub = RSA.import_key(public_pem)
    cipher = PKCS1_OAEP.new(pub)
    return base64.b64encode(cipher.encrypt(data)).decode('utf-8')

def verify_signature(public_pem: str, data: bytes, sig_b64: str) -> bool:
    try:
        pub = RSA.import_key(public_pem)
        h   = SHA256.new(data)
        sig = base64.b64decode(sig_b64)
        pkcs1_15.new(pub).verify(h, sig)
        return True
    except (ValueError, TypeError):
        return False

# --- API ENDPOINT'LERI ---
@app.route('/register', methods=['POST'])
def register():
    d = request.get_json() or {}
    if not all(k in d for k in ('username','password','rsa_public_key')):
        return jsonify(status="error", message="Tüm alanlar gerekli."), 400

    if User.query.filter_by(username=d['username']).first():
        return jsonify(status="error", message="Kullanıcı zaten var."), 400

    user = User(
        username       = d['username'],
        password       = hash_password(d['password']),
        rsa_public_key = d['rsa_public_key']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(status="success", message="Kayıt başarılı."), 200

@app.route('/login', methods=['POST'])
def login():
    d = request.get_json() or {}
    user = User.query.filter_by(username=d.get('username')).first()
    if not user or not verify_password(d.get('password', ''), user.password):
        return jsonify(status="error", message="Geçersiz kimlik."), 401

    return jsonify(
        status="success",
        message=f"{user.username} giriş yaptı.",
        server_rsa_public_key=server_rsa_public_key,
        client_rsa_public_key=user.rsa_public_key
    ), 200

@app.route('/exchange_key', methods=['POST'])
def exchange_key():
    d = request.get_json() or {}
    user = User.query.filter_by(username=d.get('username')).first()
    if not user:
        return jsonify(status="error", message="Kullanıcı bulunamadı."), 404

    client_pub = d.get('client_rsa_public_key')
    des_key     = get_random_bytes(8)
    session_keys[user.username] = des_key

    return jsonify(
        status="success",
        encrypted_des_key=rsa_encrypt(client_pub, des_key)
    ), 200

@app.route('/send_message', methods=['POST'])
def send_message():
    d = request.get_json() or {}
    # Tam payload loglama (errorsız)
    logging.info("[send_message] Payload tamamı: %s", {
        'sender': d.get('sender'),
        'recipient': d.get('recipient'),
        'encrypted_message': d.get('encrypted_message'),
        'signature': d.get('signature')
    })

    if not all(k in d for k in ('sender','recipient','encrypted_message','signature')):
        return jsonify(status="error", message="Tüm alanlar gerekli."), 400

    sender    = User.query.filter_by(username=d['sender']).first()
    recipient = User.query.filter_by(username=d['recipient']).first()
    if not sender or not recipient:
        return jsonify(status="error", message="Gönderen/Alıcı bulunamadı."), 404

    if not verify_signature(
        sender.rsa_public_key,
        d['encrypted_message'].encode(),
        d['signature']
    ):
        logging.warning("[send_message] İmza doğrulaması başarısız!")
        return jsonify(status="error", message="İmza doğrulaması başarısız."), 400

    msg = Message(
        sender            = d['sender'],
        recipient         = d['recipient'],
        encrypted_message = d['encrypted_message'],
        signature         = d['signature']
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(status="success", message="Mesaj gönderildi."), 200

@app.route('/get_messages', methods=['GET'])
def get_messages():
    username = request.args.get('username')
    user     = User.query.filter_by(username=username).first()
    if not user:
        return jsonify(status="error", message="Kullanıcı bulunamadı."), 404

    # Hem gönderdiği hem aldığı mesajları al
    sent_msgs = Message.query.filter_by(sender=username).all()
    received_msgs = Message.query.filter_by(recipient=username).all()
    
    all_msgs = sent_msgs + received_msgs
    # Timestamp'e göre sırala
    all_msgs.sort(key=lambda x: x.timestamp)
    
    out = [{
        'sender':            m.sender,
        'recipient':         m.recipient,
        'encrypted_message': m.encrypted_message,
        'signature':         m.signature,
        'timestamp':         m.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    } for m in all_msgs]

    return jsonify(status="success", messages=out), 200

@app.route('/admin/monitor', methods=['GET'])
def admin_monitor():
    token = request.args.get('admin_token')
    if token != "admin_token_example":
        return jsonify(status="error", message="Yetkisiz."), 401

    return jsonify(
        status="success",
        data   = {
            'registered_users': User.query.count(),
            'total_messages':   Message.query.count(),
            'active_sessions':  list(session_keys.keys())
        }
    ), 200

# --- PERIYODIC RSA UPDATE ---
def periodic_rsa_update(interval=600):
    while True:
        time.sleep(interval)
        generate_server_rsa_keys()

threading.Thread(
    target=periodic_rsa_update,
    args=(600,),
    daemon=True
).start()

# --- UYGULAMA BAŞLANGICI ---
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )