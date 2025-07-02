require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Example API endpoint for Reown Cloud integration
app.get('/api/wallet/balance', async (req, res) => {
    try {
        // This is where we'll implement the Reown Cloud API calls
        // You'll need to add your Reown Cloud API credentials in .env file
        res.json({ message: 'Wallet balance endpoint ready' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
