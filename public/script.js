// Check for Browser Support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. Please use Chrome on Android or Safari on iOS.");
} else {
    // 1. Initialize Variables
    const recognition = new SpeechRecognition();
    const btn = document.getElementById('recordBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const status = document.getElementById('status');
    const transcriptDiv = document.getElementById('transcript');
    const historyList = document.getElementById('historyList');

    let voiceHistory = [];

    // 2. Configure Recognition Settings
    recognition.continuous = false;    // Stops automatically when you finish a sentence
    recognition.interimResults = false; // Only returns final results
    recognition.lang = 'en-US';        // Set language

    // 3. Event: Start Listening
    btn.addEventListener('click', () => {
        try {
            recognition.start();
            btn.disabled = true;
            status.innerText = "Listening...";
            transcriptDiv.innerText = "";
        } catch (e) {
            console.error("Recognition already started or error:", e);
        }
    });

    // 4. Event: Handle Speech Result
    recognition.onresult = (event) => {
        const phrase = event.results[0][0].transcript;
        transcriptDiv.innerText = `"${phrase}"`;
        
        // Add to local history with a timestamp
        const timestamp = new Date().toLocaleTimeString();
        voiceHistory.push(`${timestamp}: ${phrase}`);
        
        updateHistoryUI();
        sendToServer(phrase);
    };

    // 5. Event: Error Handling
    recognition.onerror = (event) => {
        status.innerText = "Error: " + event.error;
        btn.disabled = false;
    };

    // 6. Event: Reset Button on End
    recognition.onend = () => {
        btn.disabled = false;
        if (status.innerText === "Listening...") {
            status.innerText = "Tap the button to speak";
        }
    };

    // 7. Function: Update UI History List
    function updateHistoryUI() {
        // Show the 5 most recent items, newest at the top
        const displayList = [...voiceHistory].reverse().slice(0, 5);
        historyList.innerHTML = displayList.join("<br>");
    }

    // 8. Function: Send Data to Node.js Server
    async function sendToServer(text) {
        status.innerText = "Sending to server...";
        try {
            const response = await fetch('/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phrase: text })
            });
            
            if (response.ok) {
                status.innerHTML = '<span class="success-flash">✓ Sent to Server</span>';
            } else {
                status.innerText = "Server Error (Check Node logs)";
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            status.innerText = "Connection Failed.";
        }
    }

    // 9. Function: Download History as .txt
    downloadBtn.addEventListener('click', () => {
        if (voiceHistory.length === 0) {
            alert("No history to download yet!");
            return;
        }
        
        // Create file content
        const fileContent = "Voice Assistant History\n" + 
                            "======================\n\n" + 
                            voiceHistory.join('\n');
                            
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary hidden link to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-log-${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}