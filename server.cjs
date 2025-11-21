import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 Backend Broadcasting Server running on port ${PORT}`);

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

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

setInterval(() => {
  if (clients.size === 0) return;

  const ticks = SYMBOLS.map((s) => {
    const move = (Math.random() - 0.5) * (s.price * 0.001);
    s.price += move;

    return {
      symbol: s.symbol,
      ltp: s.price,
      change: move,
      percentChange: (move / s.price) * 100,
      high: s.price * 1.01,
      low: s.price * 0.99,
      volume: Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
    };
  });

  const payload = JSON.stringify(ticks);

  for (const c of clients) {
    if (c.readyState === WebSocket.OPEN) {
      c.send(payload);
    }
  }
}, 1000);
