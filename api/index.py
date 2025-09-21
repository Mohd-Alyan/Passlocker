from flask import Flask, render_template, request, jsonify, send_file
from io import BytesIO
import random

app = Flask(__name__)

# =================== RSA UTILITIES ===================

def is_prime(n, k=5):
    if n < 2:
        return False
    for p in [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]:
        if n % p == 0:
            return n == p
    r, s = 0, n-1
    while s % 2 == 0:
        r += 1
        s //= 2
    for _ in range(k):
        a = random.randrange(2, n-1)
        x = pow(a, s, n)
        if x == 1 or x == n-1:
            continue
        for _ in range(r-1):
            x = pow(x, 2, n)
            if x == n-1:
                break
        else:
            return False
    return True

def generate_large_prime(bits=512):
    while True:
        n = random.getrandbits(bits)
        n |= (1 << bits-1) | 1
        if is_prime(n):
            return n

def gcd(a,b):
    while b:
        a,b = b, a%b
    return a

def multiplicative_inverse(e, phi):
    d0, d1 = 0,1
    r0, r1 = phi, e
    while r1 != 0:
        q = r0 // r1
        d0, d1 = d1, d0 - q*d1
        r0, r1 = r1, r0 - q*r1
    if r0 != 1:
        raise Exception("Multiplicative inverse not found")
    return d0 % phi

def generate_keys():
    p = generate_large_prime(1024)
    q = generate_large_prime(1024)
    n = p*q
    phi = (p-1)*(q-1)
    e = 65537
    if gcd(e, phi) != 1:
        e = 3
        while gcd(e, phi) != 1:
            e += 2
    d = multiplicative_inverse(e, phi)
    return ((e,n),(d,n))

def encrypt_rsa(msg, pubkey):
    e, n = pubkey
    msg_bytes = msg.encode()
    encrypted = [pow(b,e,n) for b in msg_bytes]
    return encrypted

def decrypt_rsa(cipher_list, privkey):
    d, n = privkey
    decrypted = bytes([pow(c,d,n) for c in cipher_list])
    return decrypted.decode()

# =================== ROUTES ===================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.get_json()
    message = data.get('message','').strip()
    if not message:
        return jsonify(success=False, error="Empty message")
    
    try:
        pub, priv = generate_keys()
        cipher_list = encrypt_rsa(message, pub)

        # Return encrypted and key as strings
        encrypted_str = ','.join(map(str, cipher_list))
        key_str = f"{priv[0]},{priv[1]}"

        return jsonify(
            success=True,
            encrypted_content=encrypted_str,
            key_content=key_str
        )
    except Exception as e:
        return jsonify(success=False, error=str(e))

@app.route('/decrypt', methods=['POST'])
def decrypt():
    data = request.get_json()
    cipher_text = data.get('cipher','').strip()
    key_text = data.get('key','').strip()

    if not cipher_text or not key_text:
        return jsonify(success=False, error="Missing data")

    try:
        cipher_list = list(map(int, cipher_text.split(',')))
        d, n = map(int, key_text.split(','))
        privkey = (d,n)

        decrypted_message = decrypt_rsa(cipher_list, privkey)
        return jsonify(success=True, decrypted_content=decrypted_message)
    except Exception as e:
        return jsonify(success=False, error=str(e))

# =================== RUN APP ===================

if __name__ == '__main__':
    app.run()
