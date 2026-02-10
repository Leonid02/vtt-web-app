
// At the top of your script
let voiceHistory = [];

const downloadBtn = document.getElementById('downloadBtn');
const historyList = document.getElementById('historyList');

// Inside the recognition.onresult function, after you call sendToServer(phrase):
voiceHistory.push(`${new Date().toLocaleTimeString()}: ${phrase}`);
updateHistoryUI();

// Add these functions at the bottom of the file:
function updateHistoryUI() {
    historyList.innerHTML = "<strong>History:</strong><br>" + voiceHistory.slice(-3).join("<br>");
}

downloadBtn.addEventListener('click', () => {
    if (voiceHistory.length === 0) {
        alert("No history to download yet!");
        return;
    }
    
    const blob = new Blob([voiceHistory.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `voice-history-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. Please use Chrome on Android or Safari on iOS.");
} else {
    const recognition = new SpeechRecognition();
    const btn = document.getElementById('recordBtn');
    const status = document.getElementById('status');
    const transcriptDiv = document.getElementById('transcript');

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    btn.addEventListener('click', () => {
        try {
            recognition.start();
            btn.disabled = true;
            status.innerText = "Listening...";
            transcriptDiv.innerText = "";
        } catch (e) {
            console.error(e);
        }
    });

    recognition.onresult = (event) => {
        const phrase = event.results[0][0].transcript;
        transcriptDiv.innerText = `"${phrase}"`;
        sendToServer(phrase);
    };

    recognition.onerror = (event) => {
        status.innerText = "Error occurred: " + event.error;
        btn.disabled = false;
    };

    recognition.onend = () => {
        btn.disabled = false;
    };

    async function sendToServer(text) {
        status.innerText = "Sending to server...";
        try {
            const response = await fetch('/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phrase: text })
            });
            
            if (response.ok) {
                status.innerHTML = '<span class="success-flash">Sent Successfully!</span>';
            } else {
                status.innerText = "Server Error.";
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            status.innerText = "Could not reach server.";
        }
    }

    function updateHistoryUI() {
    // Show the last 5 entries in the UI
    const displayList = voiceHistory.slice(-5).reverse(); 
    document.getElementById('historyList').innerHTML = displayList.join("<br>");
}
}