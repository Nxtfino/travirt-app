
import { useState, useEffect, useRef } from 'react';
import { Stock, TickData } from '../types';
import { MOCK_STOCKS, BROADCAST_WS_URL } from '../constants';

export const useMarketData = () => {
    const [marketData, setMarketData] = useState<Stock[]>(MOCK_STOCKS);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    
    // Maintain a ref to the latest data to avoid stale closures in WS callbacks
    const marketDataRef = useRef<Stock[]>(MOCK_STOCKS);
    const retryCountRef = useRef(0);

    useEffect(() => {
        let ws: WebSocket | null = null;
        let mockIntervalId: number | undefined;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const stopMockData = () => {
            if (mockIntervalId !== undefined) {
                clearInterval(mockIntervalId);
                mockIntervalId = undefined;
            }
        };

        const startMockData = () => {
            stopMockData(); // Ensure no duplicate intervals
            
            // Initialize mock data if needed
            let currentStocks = marketDataRef.current.length > 0 ? marketDataRef.current : MOCK_STOCKS.map(stock => ({
                ...stock,
                change: stock.ltp - stock.prevClose,
                changePercent: ((stock.ltp - stock.prevClose) / stock.prevClose) * 100,
            }));

            mockIntervalId = window.setInterval(() => {
                if (isConnected) return; // Stop updating mock if real WS is connected

                currentStocks = currentStocks.map(stock => {
                    const changeFactor = (Math.random() - 0.5) * 0.01; // +/- 1% change
                    const newLtp = stock.ltp * (1 + changeFactor);
                    const newChange = newLtp - stock.prevClose;
                    const newChangePercent = (newChange / stock.prevClose) * 100;

                    return {
                        ...stock,
                        ltp: newLtp,
                        change: newChange,
                        changePercent: newChangePercent,
                        high: Math.max(stock.high, newLtp),
                        low: Math.min(stock.low, newLtp),
                    };
                });
                
                marketDataRef.current = currentStocks;
                setMarketData(currentStocks);
            }, 1000);
            setLoading(false);
        };

        const connectWebSocket = () => {
            try {
                ws = new WebSocket(BROADCAST_WS_URL);

                ws.onopen = () => {
                    console.log("Connected to Backend Broadcasting WebSocket");
                    setIsConnected(true);
                    setLoading(false);
                    stopMockData();
                    retryCountRef.current = 0; // Reset retries on success
                };

                ws.onmessage = (event) => {
                    try {
                        // Expecting either a single tick or array of ticks
                        const payload: TickData | TickData[] = JSON.parse(event.data);
                        const ticks = Array.isArray(payload) ? payload : [payload];
                        
                        const updatedStocks = [...marketDataRef.current];
                        let hasChanges = false;

                        ticks.forEach(tick => {
                            const index = updatedStocks.findIndex(s => s.symbol === tick.symbol);
                            if (index !== -1) {
                                hasChanges = true;
                                const stock = updatedStocks[index];
                                updatedStocks[index] = {
                                    ...stock,
                                    ltp: tick.ltp || stock.ltp,
                                    change: tick.change ?? (tick.ltp ? tick.ltp - stock.prevClose : stock.change),
                                    changePercent: tick.percentChange ?? (tick.ltp ? ((tick.ltp - stock.prevClose)/stock.prevClose)*100 : stock.changePercent),
                                    high: tick.high ? Math.max(stock.high, tick.high) : (tick.ltp ? Math.max(stock.high, tick.ltp) : stock.high),
                                    low: tick.low ? Math.min(stock.low, tick.low) : (tick.ltp ? Math.min(stock.low, tick.ltp) : stock.low),
                                    volume: tick.volume || stock.volume
                                };
                            }
                        });

                        if (hasChanges) {
                            marketDataRef.current = updatedStocks;
                            setMarketData(updatedStocks);
                        }
                    } catch (e) {
                        console.error("Error parsing WebSocket message", e);
                    }
                };

                ws.onclose = () => {
                    setIsConnected(false);
                    startMockData();
                    
                    // Exponential backoff: 1s, 2s, 4s... up to 30s max
                    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                    retryCountRef.current += 1;
                    
                    reconnectTimeout = setTimeout(connectWebSocket, delay);
                };

                ws.onerror = (err) => {
                    // Silent failure (do not log to console) to allow smooth fallback
                    ws?.close(); // This triggers onclose
                };

            } catch (error) {
                // Silent catch
                startMockData();
                reconnectTimeout = setTimeout(connectWebSocket, 5000);
            }
        };

        // Start connection attempt
        connectWebSocket();

        return () => {
            if (ws) {
                ws.onclose = null; // Prevent reconnect loop on unmount
                ws.onerror = null;
                ws.close();
            }
            stopMockData();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };

    }, []); // Run once on mount

    return { marketData, loading, isConnected };
};
