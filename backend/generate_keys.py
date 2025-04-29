# generate_keys.py
from Crypto.PublicKey import RSA

# 2048-bit RSA anahtarı oluştur
key = RSA.generate(2048)

# Private ve public PEM’e çevir
private_pem = key.export_key(format='PEM')
public_pem  = key.publickey().export_key(format='PEM')

# Dosyalara yaz
with open('private.pem', 'wb') as f:
    f.write(private_pem)
with open('public.pem', 'wb') as f:
    f.write(public_pem)

print("✅ RSA anahtar çifti oluşturuldu: private.pem & public.pem")
