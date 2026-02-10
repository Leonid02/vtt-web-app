const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// 1. Port Configuration
// process.env.PORT is required for cloud deployment (Render/Railway)
const PORT = process.env.PORT || 3000;

// 2. Middleware
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Parses incoming JSON data

// 3. Serve Static Files
// This serves everything in your 'public' folder (index.html, css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// 4. API Endpoint
// This is where your mobile app sends the voice text
app.post('/receive', (req, res) => {
    const { phrase } = req.body;

    if (!phrase) {
        console.log("Empty phrase received.");
        return res.status(400).json({ error: "No phrase found in request" });
    }

    // LOGGING: You will see this in your Render/Railway logs
    console.log(`[${new Date().toISOString()}] Received: "${phrase}"`);

    // RESPOND: Tell the mobile app we got it
    res.json({ 
        status: "success", 
        message: "Server received your voice phrase!",
        echo: phrase 
    });
});

// 5. Default Route
// Ensures that visiting the root URL always loads the index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. Start Server
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
    console.log(`-----------------------------------------`);
});