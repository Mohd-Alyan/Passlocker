// =================== ELEMENTS ===================
const messageInput = document.getElementById('message-input');
const wordCountEl = document.getElementById('word-count');
const encryptBtn = document.getElementById('encrypt-btn');
const encryptResults = document.getElementById('encrypt-results');
const downloadEncrypted = document.getElementById('download-encrypted');
const downloadKey = document.getElementById('download-key');

const cipherUploadArea = document.getElementById('cipher-upload-area');
const cipherFileInput = document.getElementById('cipher-file');
const cipherFileName = document.getElementById('cipher-file-name');

const keyUploadArea = document.getElementById('key-upload-area');
const keyFileInput = document.getElementById('key-file');
const keyFileName = document.getElementById('key-file-name');

const decryptBtn = document.getElementById('decrypt-btn');
const decryptResults = document.getElementById('decrypt-results');

// =================== WORD COUNTER ===================
messageInput.addEventListener('input', () => {
    const words = messageInput.value.trim().split(/\s+/).filter(Boolean);
    wordCountEl.textContent = words.length;
    wordCountEl.parentElement.classList.toggle('over-limit', words.length > 500);
});

// =================== ENCRYPTION ===================
encryptBtn.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    if (!message) {
        alert("Please enter a message to encrypt!");
        return;
    }

    encryptBtn.classList.add('loading');

    try {
        const res = await fetch('/encrypt', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({message})
        });
        const data = await res.json();
        encryptBtn.classList.remove('loading');

        if (data.success) {
            encryptResults.classList.add('show');

            // Set download links to server files
            downloadEncrypted.href = data.encrypted_url;
            downloadEncrypted.download = 'encrypted.txt';

            downloadKey.href = data.key_url;
            downloadKey.download = 'key.txt';
        } else {
            alert("Encryption failed: " + data.error);
        }
    } catch (err) {
        encryptBtn.classList.remove('loading');
        alert("Encryption error: " + err.message);
    }
});

// =================== FILE UPLOAD UI ===================
function setupFileUpload(area, input, label) {
    area.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        if (input.files.length) {
            area.classList.add('file-selected');
            label.textContent = input.files[0].name;
            checkDecryptReady();
        } else {
            area.classList.remove('file-selected');
            label.textContent = "No file selected";
            checkDecryptReady();
        }
    });
}

setupFileUpload(cipherUploadArea, cipherFileInput, cipherFileName);
setupFileUpload(keyUploadArea, keyFileInput, keyFileName);

// Enable decrypt button only when both files are selected
function checkDecryptReady() {
    decryptBtn.disabled = !(cipherFileInput.files.length && keyFileInput.files.length);
}

// =================== DECRYPTION ===================
decryptBtn.addEventListener('click', async () => {
    if (!cipherFileInput.files.length || !keyFileInput.files.length) return;

    decryptBtn.classList.add('loading');

    const formData = new FormData();
    formData.append('cipher_file', cipherFileInput.files[0]);
    formData.append('key_file', keyFileInput.files[0]);

    try {
        const res = await fetch('/decrypt', {method: 'POST', body: formData});
        decryptBtn.classList.remove('loading');

        const data = await res.json();

        if (data.success) {
            decryptResults.classList.add('show');
            downloadDecrypted.href = data.decrypted_url;
            downloadDecrypted.download = 'decrypted.txt';
        } else {
            alert("Decryption failed: " + (data.error || 'Unknown error'));
        }
    } catch (err) {
        decryptBtn.classList.remove('loading');
        alert("Decryption error: " + err.message);
    }
});
