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

    // Configuration
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // 1. Vibration Helper (Safe-check for support)
    function vibrate() {
        if (typeof navigator.vibrate === 'function') {
            navigator.vibrate(50);
        }
    }

    // 2. Main Recording Logic
    btn.addEventListener('click', () => {
        vibrate();
        
        try {
            // We start recognition directly. 
            // The browser will automatically handle the permission popup.
            recognition.start();
            
            btn.disabled = true;
            status.innerText = "Listening...";
            transcriptDiv.innerText = "Listening for voice...";
        } catch (err) {
            console.error("Recognition start error:", err);
            // If already started, don't crash
            if (err.name === 'InvalidStateError') {
                status.innerText = "Already listening...";
            } else {
                status.innerText = "Mic Error: " + err.message;
                btn.disabled = false;
            }
        }
    });

    // 3. Handle Successful Result
    recognition.onresult = (event) => {
        const phrase = event.results[0][0].transcript;
        transcriptDiv.innerText = `"${phrase}"`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        voiceHistory.push(`${timestamp}: ${phrase}`);
        
        updateHistoryUI();
        sendToServer(phrase);
    };

    // 4. Handle End of Speech
    recognition.onend = () => {
        btn.disabled = false;
        // Only reset text if we aren't displaying a success message
        if (!status.innerHTML.includes('Received')) {
            status.innerText = "Tap to speak again";
        }
    };

    // 5. Handle Errors
    recognition.onerror = (event) => {
        btn.disabled = false;
        console.error("Speech Recognition Error:", event.error);
        
        if (event.error === 'not-allowed') {
            status.innerHTML = '<span class="error-text">❌ Mic Access Blocked</span>';
            alert("Microphone blocked. Please tap the lock icon in your address bar and Allow microphone access.");
        } else if (event.error === 'no-speech') {
            status.innerText = "No speech detected. Try again.";
        } else {
            status.innerText = "Error: " + event.error;
        }
    };

    // 6. Server Communication
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
            } else {
                status.innerText = "Server Error";
            }
        } catch (error) {
            console.error("Fetch error:", error);
            status.innerHTML = '<span class="error-text">Connection Failed</span>';
        }
    }

    // 7. Update History UI
    function updateHistoryUI() {
        const recent = [...voiceHistory].reverse().slice(0, 5);
        historyList.innerHTML = recent.join("<br>");
    }

    // 8. Download Functionality
    downloadBtn.addEventListener('click', () => {
        if (voiceHistory.length === 0) {
            alert("No history recorded yet.");
            return;
        }
        
        const content = "VOICE ASSISTANT LOG\n==================\n" + voiceHistory.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-history-${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}