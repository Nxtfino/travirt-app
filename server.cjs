// =============================
// CJS VERSION FOR RENDER
// Works with Node 18+
// =============================

// WebSocket (CJS import)
const WebSocket = require("ws");
const { WebSocketServer } = require("ws");

// HTTP server for Render health checks
const http = require("http");

// Render forces dynamic port from environment
const PORT = process.env.PORT || 10000;

console.log(`🚀 Backend Broadcasting Server starting on port ${PORT}...`);

// Create REQUIRED HTTP Server for Render health check
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("OK");
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WS server running");
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

// Start HTTP server
server.listen(PORT, () => {
  console.log(`🌐 HTTP + WebSocket server live on ${PORT}`);
});

// =============================
//  🔔 STOCK MARKET TICK STREAM
// =============================

const SYMBOLS = [
  { symbol: "NIFTY 50", price: 25910.05 },
  { symbol: "NIFTY BANK", price: 58517.2 },
  { symbol: "RELIANCE", price: 1480.0 },
  { symbol: "TCS", price: 2993.5 },
  { symbol: "HDFCBANK", price: 1650.0 },
  { symbol: "INFY", price: 1478.0 },
  { symbol: "TATASTEEL", price: 181.5 },
  { symbol: "NIFTY OCT FUT", price: 26050.0 },
  { symbol: "BANKNIFTY OCT FUT", price: 58700.0 },
];

const clients = new Set();

// On client connect
wss.on("connection", (ws) => {
  console.log("🔥 Client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    clients.delete(ws);
  });
});

// Send market ticks every 1s
setInterval(() => {
  if (clients.size === 0) return;

  const ticks = SYMBOLS.map((s) => {
    const move = (Math.random() - 0.5) * (s.price * 0.001);
    s.price += move;

    return {
      symbol: s.symbol,
      ltp: Number(s.price.toFixed(2)),
      change: Number(move.toFixed(2)),
      percentChange: Number(((move / s.price) * 100).toFixed(2)),
      high: Number((s.price * 1.01).toFixed(2)),
      low: Number((s.price * 0.99).toFixed(2)),
      volume: Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
    };
  });

  const payload = JSON.stringify(ticks);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}, 1000);
