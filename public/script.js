const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. Please use Chrome on Android or Safari on iOS.");
} else {
    // UI Elements
    const btn = document.getElementById('recordBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const status = document.getElementById('status');
    const transcriptDiv = document.getElementById('transcript');
    const historyList = document.getElementById('historyList');

    let voiceHistory = [];
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // 1. Permission Check (Android/Chrome)
    async function checkMicPermission() {
        try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            updateUIByPermission(permissionStatus.state);
            permissionStatus.onchange = () => updateUIByPermission(permissionStatus.state);
        } catch (e) {
            console.log("Permissions API not supported (iOS).");
        }
    }

    function updateUIByPermission(state) {
        if (state === 'denied') {
            status.innerHTML = '<span class="error-text">❌ Mic Access Blocked</span>';
            btn.style.opacity = "0.5";
        }
    }

    // 2. Vibration Helper
    function vibrate() {
        if (navigator.vibrate) navigator.vibrate(50);
    }

    // 3. Start Recording
    btn.addEventListener('click', async () => {
        try {
            // Request mic stream to ensure permission popup on iOS
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            vibrate();
            recognition.start();
            btn.disabled = true;
            status.innerText = "Listening...";
            transcriptDiv.innerText = "";
        } catch (err) {
            status.innerHTML = '<span class="error-text">Permission Denied</span>';
            alert("Please enable microphone access in your browser settings.");
        }
    });

    // 4. Handle Results
    recognition.onresult = (event) => {
        const phrase = event.results[0][0].transcript;
        transcriptDiv.innerText = `"${phrase}"`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        voiceHistory.push(`${timestamp}: ${phrase}`);
        
        updateHistoryUI();
        sendToServer(phrase);
    };

    recognition.onend = () => {
        btn.disabled = false;
        if (!status.innerHTML.includes('Sent')) {
            status.innerText = "Tap to speak again";
        }
    };

    recognition.onerror = (event) => {
        btn.disabled = false;
        status.innerHTML = `<span class="error-text">Error: ${event.error}</span>`;
    };

    // 5. Server Communication
    async function sendToServer(text) {
        status.innerText = "Sending...";
        try {
            const response = await fetch('/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phrase: text })
            });
            
            if (response.ok) {
                status.innerHTML = '<span class="success-flash">✓ Received by Server</span>';
            }
        } catch (error) {
            status.innerHTML = '<span class="error-text">Connection Failed</span>';
        }
    }

    // 6. History UI
    function updateHistoryUI() {
        const recent = [...voiceHistory].reverse().slice(0, 5);
        historyList.innerHTML = recent.join("<br>");
    }

    // 7. Download Logic
    downloadBtn.addEventListener('click', () => {
        if (voiceHistory.length === 0) return alert("No history yet.");
        
        const content = "VOICE LOG\n=========\n" + voiceHistory.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-log-${new Date().toLocaleDateString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    checkMicPermission();
}