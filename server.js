
const WebSocket = require('ws');

// Configuration
const PORT = process.env.PORT || 8080;

// Create WebSocket Server
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 Backend Broadcasting Server running on port ${PORT}`);

// Mock Data Generator (Simulating AliceBlue Feed)
// In production, you would replace this with real AliceBlue socket connection
const SYMBOLS = [
    { symbol: 'NIFTY 50', price: 25910.05 },
    { symbol: 'NIFTY BANK', price: 58517.20 },
    { symbol: 'RELIANCE', price: 1480.00 },
    { symbol: 'TCS', price: 2993.50 },
    { symbol: 'HDFCBANK', price: 1650.00 },
    { symbol: 'INFY', price: 1478.00 },
    { symbol: 'TATASTEEL', price: 181.50 },
    { symbol: 'NIFTY OCT FUT', price: 26050.00 }, // Futures
    { symbol: 'BANKNIFTY OCT FUT', price: 58700.00 } // Futures
];

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

// Broadcast Loop (Simulates "Tick" data from AliceBlue -> Redis -> Here)
setInterval(() => {
    if (clients.size === 0) return;

    const ticks = SYMBOLS.map(s => {
        // Random movement logic
        const move = (Math.random() - 0.5) * (s.price * 0.001); 
        s.price += move;

        return {
            symbol: s.symbol,
            ltp: s.price,
            change: move,
            percentChange: (move / s.price) * 100,
            high: s.price * 1.01, // simplified
            low: s.price * 0.99,  // simplified
            volume: Math.floor(Math.random() * 1000),
            timestamp: Date.now()
        };
    });

    // Send data to all connected frontends
    const payload = JSON.stringify(ticks);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}, 1000); // Broadcast every second
