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
}