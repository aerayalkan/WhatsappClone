# backend/decrypt_key.py

from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import base64

def main():
    # 1) private.pem dosyanızı okuyun
    with open('private.pem', 'rb') as f:
        priv = RSA.import_key(f.read())
    cipher = PKCS1_OAEP.new(priv)

    # 2) Kullanıcıdan terminalde şifreli DES anahtarını isteyelim
    enc_b64 = input("Şifreli DES anahtarını buraya yapıştırıp ENTER’a basın:\n")

    try:
        enc_bytes = base64.b64decode(enc_b64)
        raw = cipher.decrypt(enc_bytes)
    except Exception as e:
        print("‼️ Hata:", e)
        return

    # 3) Sonuçları göster
    raw_b64 = base64.b64encode(raw).decode()
    print("\n🔐 Raw DES key (bytes):", raw)
    print("🔑 DES key (base64):", raw_b64)
    print("\n▶ Tarayıcıda bu base64’i şu komutla saklayın:")
    print(f"  localStorage.setItem('sessionKeyRaw','{raw_b64}')")

if __name__ == '__main__':
    main()
