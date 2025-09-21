// ===== ELEMENT SELECTORS =====
const messageInput = document.getElementById('message-input');
const wordCount = document.getElementById('word-count');
const encryptBtn = document.getElementById('encrypt-btn');
const decryptBtn = document.getElementById('decrypt-btn');
const encryptResults = document.getElementById('encrypt-results');
const decryptResults = document.getElementById('decrypt-results');

const cipherFileInput = document.getElementById('cipher-file');
const keyFileInput = document.getElementById('key-file');
const cipherUploadArea = document.getElementById('cipher-upload-area');
const keyUploadArea = document.getElementById('key-upload-area');
const cipherFileName = document.getElementById('cipher-file-name');
const keyFileName = document.getElementById('key-file-name');

const notificationContainer = document.getElementById('notification-container');

// ===== WORD COUNTER =====
messageInput.addEventListener('input', () => {
    const words = messageInput.value.trim().split(/\s+/).filter(Boolean).length;
    wordCount.textContent = words;
    wordCount.parentElement.classList.toggle('over-limit', words > 500);
});

// ===== FILE UPLOAD =====
function setupFileUpload(area, input, displayName) {
    area.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        if (input.files.length > 0) {
            displayName.textContent = input.files[0].name;
            area.classList.add('file-selected');
        } else {
            displayName.textContent = 'No file selected';
            area.classList.remove('file-selected');
        }
        decryptBtn.disabled = !(cipherFileInput.files.length && keyFileInput.files.length);
    });
    ['dragover','dragenter'].forEach(evt => area.addEventListener(evt,e=>{e.preventDefault();area.classList.add('drag-over');}));
    ['dragleave','drop'].forEach(evt => area.addEventListener(evt,e=>{e.preventDefault();area.classList.remove('drag-over');}));
    area.addEventListener('drop', e => {
        e.preventDefault();
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
    });
}
setupFileUpload(cipherUploadArea, cipherFileInput, cipherFileName);
setupFileUpload(keyUploadArea, keyFileInput, keyFileName);

// ===== NOTIFICATIONS =====
function notify(title, message, type='info') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':type==='error'?'fa-exclamation-circle':'fa-info-circle'}"></i>
                       <div class="notification-content"><div class="notification-title">${title}</div><div class="notification-message">${message}</div></div>
                       <button class="notification-close">&times;</button>`;
    notificationContainer.appendChild(notif);
    notif.querySelector('.notification-close').onclick = () => notif.remove();
    setTimeout(()=>notif.remove(),5000);
}

// ===== DOWNLOAD FUNCTION =====
function downloadFile(filename, content) {
    const blob = new Blob([content],{type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== ENCRYPT =====
encryptBtn.addEventListener('click', async () => {
    const text = messageInput.value.trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    if(!text) return notify('Error','Please enter a message to encrypt','error');
    if(words>500) return notify('Error','Message exceeds 500 words','error');

    encryptBtn.classList.add('loading');
    try {
        const res = await fetch('/encrypt',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({message:text})
        });
        const data = await res.json();
        if(data.success){
            encryptResults.classList.add('show');
            downloadFile("encrypted.txt", data.encrypted_text);
            downloadFile("key.txt", data.key_text);
            notify('Success','Message encrypted successfully','success');
        } else {
            notify('Error',data.error||'Encryption failed','error');
        }
    } catch(err){ notify('Error','Encryption failed','error'); }
    finally{ encryptBtn.classList.remove('loading'); }
});

// ===== DECRYPT =====
decryptBtn.addEventListener('click', async () => {
    if(!cipherFileInput.files.length || !keyFileInput.files.length) return;
    decryptBtn.classList.add('loading');

    const formData = new FormData();
    formData.append('cipher_file', cipherFileInput.files[0]);
    formData.append('key_file', keyFileInput.files[0]);

    try {
        const res = await fetch('/decrypt',{method:'POST', body:formData});
        const data = await res.json();
        if(data.success){
            decryptResults.classList.add('show');
            downloadFile("decrypted.txt", data.decrypted_text);
            notify('Success','Message decrypted successfully','success');
        } else {
            notify('Error',data.error||'Decryption failed','error');
        }
    } catch(err){ notify('Error','Decryption failed','error'); }
    finally{ decryptBtn.classList.remove('loading'); }
});
