import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, Time, CandlestickData, HistogramData } from 'lightweight-charts';
import type { Stock, InstrumentType, Candle } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface ChartPanelProps {
    stock: Stock;
}

// Helper to generate mock historical candles
// In your production app, this would be replaced by: await fetch(`${API_URL}/candles?symbol=${symbol}`)
const generateHistoricalData = (basePrice: number, count: number): Candle[] => {
    const data: Candle[] = [];
    const now = Math.floor(Date.now() / 1000);
    const currentMinute = Math.floor(now / 60) * 60; // Align to minute boundary
    
    let time = currentMinute - ((count - 1) * 60); // Start 'count-1' minutes ago so last candle is 'now'
    let currentPrice = basePrice;

    for (let i = 0; i < count; i++) {
        const open = currentPrice;
        const high = open + Math.random() * (basePrice * 0.002);
        const low = open - Math.random() * (basePrice * 0.002);
        const close = (open + high + low) / 3 + (Math.random() - 0.5) * (basePrice * 0.001);
        const volume = Math.floor(Math.random() * 10000) + 500;

        data.push({
            time: time as any, // Cast to any to satisfy lightweight-charts types if needed, though number is valid
            open,
            high: Math.max(high, open, close),
            low: Math.min(low, open, close),
            close,
            volume
        });

        currentPrice = close;
        time += 60; // 1 minute candles
    }
    return data;
};

const ChartPanel: React.FC<ChartPanelProps> = ({ stock }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);

    const { displayTitle, isOption } = useMemo(() => {
        let displayTitle = stock.name;
        let isOption = false;

        if (stock.instrumentType === InstrumentType.OPTION) {
            isOption = true;
            displayTitle = `${stock.symbol} (Underlying: ${stock.underlying})`;
        }
        return { displayTitle, isOption };
    }, [stock]);

    // 1. Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#0B1B3F' },
                textColor: '#93C5FD',
            },
            grid: {
                vertLines: { color: '#1E3A8A' },
                horzLines: { color: '#1E3A8A' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            timeScale: {
                borderColor: '#1E3A8A',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#1E3A8A',
            },
        });

        // Candlestick Series
        // Cast to any to bypass "Property 'addCandlestickSeries' does not exist" error
        const candleSeries = (chart as any).addCandlestickSeries({
            upColor: '#10B981',
            downColor: '#EF4444',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
        });

        // Volume Series (Histogram)
        // Cast to any to bypass "Property 'addHistogramSeries' does not exist" error
        const volumeSeries = (chart as any).addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // Overlay on top of candles
        });
        
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // Highest volume bar is 20% height of bottom
                bottom: 0,
            },
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        // Resize Handler
        const handleResize = () => {
            // Wrap in requestAnimationFrame to suppress "ResizeObserver loop limit exceeded" error
            window.requestAnimationFrame(() => {
                if (chartContainerRef.current && chartRef.current) {
                    chartRef.current.applyOptions({ 
                        width: chartContainerRef.current.clientWidth, 
                        height: chartContainerRef.current.clientHeight 
                    });
                }
            });
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    // 2. Load Data when Stock Changes
    useEffect(() => {
        if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

        // Simulate fetching historical data from your Node.js backend
        // Generate 200 candles, ending at the current minute
        const history = generateHistoricalData(stock.ltp, 200);
        
        // Cast to unknown then to specific data type to resolve type mismatch between number and Time
        candleSeriesRef.current.setData(history as unknown as CandlestickData<Time>[]);
        
        const volumeData = history.map(h => ({
            time: h.time as Time,
            value: h.volume || 0,
            color: h.close >= h.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        }));
        
        volumeSeriesRef.current.setData(volumeData as HistogramData<Time>[]);
        setCurrentCandle(history[history.length - 1]);

        if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
        }
    }, [stock.symbol]); // Re-run when symbol changes

    // 3. Simulate Real-time WebSocket Ticks
    useEffect(() => {
        if (!candleSeriesRef.current || !currentCandle) return;

        const interval = setInterval(() => {
            // In a real app, this comes from your socket.on('tick')
            // Aggregating ticks into the current candle
            
            const lastCandle = currentCandle;
            const tickPrice = stock.ltp; // This would come from the live feed
            const now = Math.floor(Date.now() / 1000);
            const currentMinute = Math.floor(now / 60) * 60; // Align to minute
            
            // Check if we have moved to a new minute
            const isNewMinute = currentMinute > (lastCandle.time as number);

            if (isNewMinute) {
                const newCandle: Candle = {
                    time: currentMinute as any,
                    open: tickPrice,
                    high: tickPrice,
                    low: tickPrice,
                    close: tickPrice,
                    volume: Math.floor(Math.random() * 50),
                };
                candleSeriesRef.current?.update(newCandle as unknown as CandlestickData<Time>);
                setCurrentCandle(newCandle);
                
                // Update volume
                volumeSeriesRef.current?.update({
                    time: currentMinute as Time,
                    value: newCandle.volume!,
                    color: 'rgba(16, 185, 129, 0.3)' 
                } as HistogramData<Time>);

            } else {
                // Update existing candle
                const updatedCandle: Candle = {
                    ...lastCandle,
                    high: Math.max(lastCandle.high, tickPrice),
                    low: Math.min(lastCandle.low, tickPrice),
                    close: tickPrice,
                    volume: (lastCandle.volume || 0) + Math.floor(Math.random() * 10)
                };
                candleSeriesRef.current?.update(updatedCandle as unknown as CandlestickData<Time>);
                setCurrentCandle(updatedCandle);
                 
                 // Update volume
                volumeSeriesRef.current?.update({
                    time: lastCandle.time as Time,
                    value: updatedCandle.volume!,
                    color: updatedCandle.close >= updatedCandle.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                } as HistogramData<Time>);
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [stock.ltp, currentCandle]);


    return (
        <div className="flex flex-col h-full relative bg-base rounded-lg overflow-hidden">
            {/* Header with stock info */}
            <div className="flex justify-between items-start p-3 border-b border-overlay z-10 bg-surface shadow-md">
                <div>
                    <h2 className="text-lg font-bold text-text-primary flex items-center">
                        {displayTitle} 
                        {!isOption && <span className="text-xs text-muted ml-2 bg-overlay px-1.5 py-0.5 rounded">{stock.exchange}</span>}
                    </h2>
                     <div className="flex items-center gap-3 text-xs mt-1">
                        <span className={`font-bold text-lg ${stock.change >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(stock.ltp)}
                        </span>
                         <span className={`font-medium ${stock.change >= 0 ? 'text-success' : 'text-danger'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({formatPercent(stock.changePercent/100)})
                        </span>
                    </div>
                </div>
                
                {/* OHLC Pill */}
                <div className="hidden md:flex gap-3 text-[10px] bg-base/50 px-3 py-1 rounded-full border border-overlay/50">
                    <div className="flex flex-col items-center"><span className="text-muted">O</span> <span className="text-text-secondary">{formatCurrency(stock.open, 2)}</span></div>
                    <div className="flex flex-col items-center"><span className="text-muted">H</span> <span className="text-text-secondary">{formatCurrency(stock.high, 2)}</span></div>
                    <div className="flex flex-col items-center"><span className="text-muted">L</span> <span className="text-text-secondary">{formatCurrency(stock.low, 2)}</span></div>
                    <div className="flex flex-col items-center"><span className="text-muted">C</span> <span className="text-text-secondary">{formatCurrency(stock.prevClose, 2)}</span></div>
                </div>
            </div>

            {isOption && (
                <div className="bg-yellow-500/10 text-yellow-400 px-3 py-1 text-xs border-b border-yellow-500/20 text-center">
                    <i className="fas fa-info-circle mr-1"></i>
                    Viewing Spot Chart (Option charts require premium feed)
                </div>
            )}

            {/* Lightweight Chart Container */}
            <div className="flex-1 w-full relative" ref={chartContainerRef} />
            
            {/* Chart Toolbar (Mock) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-surface/90 backdrop-blur px-2 py-1 rounded-full border border-overlay shadow-lg z-20">
                {['1m', '5m', '15m', '1h', '1D'].map((tf) => (
                     <button key={tf} className="text-xs font-semibold text-muted hover:text-text-primary hover:bg-overlay px-2 py-1 rounded transition-colors">
                        {tf}
                    </button>
                ))}
                 <div className="w-px bg-overlay mx-1"></div>
                 <button className="text-xs text-muted hover:text-primary px-2 py-1"><i className="fas fa-pencil-alt"></i></button>
                 <button className="text-xs text-muted hover:text-primary px-2 py-1"><i className="fas fa-fx"></i></button>
            </div>
        </div>
    );
};

export default ChartPanel;