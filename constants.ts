
import { Stock, NewsArticle, MarketDepth, OverviewAsset, DiscoverList, InstrumentType } from './types';

// Points to your Node.js Backend (Broadcasting WebSocket)
// If VITE_WS_URL is set (in Production), use it. Otherwise use Localhost.
// We use a safe access pattern here because import.meta.env might be undefined in some environments
const env = (import.meta as any)?.env || {};
export const BROADCAST_WS_URL = env.VITE_WS_URL || 'ws://localhost:8080';

const generateMockDepth = (ltp: number): MarketDepth => {
    const bids = [];
    const asks = [];
    for (let i = 0; i < 20; i++) { // Increased from 5 to 20
        bids.push({
            price: ltp - (i + 1) * 0.05 - Math.random() * 0.05,
            orders: Math.floor(Math.random() * 15) + 1,
            quantity: Math.floor(Math.random() * 2000) + 50
        });
        asks.push({
            price: ltp + (i + 1) * 0.05 + Math.random() * 0.05,
            orders: Math.floor(Math.random() * 15) + 1,
            quantity: Math.floor(Math.random() * 2000) + 50
        });
    }
    return { bids, asks };
};

const generateStockDetails = (stock: Omit<Stock, 'marketDepth' | 'volume' | 'avgTradePrice' | 'lastTradedQuantity' | 'lastTradedAt' | 'lowerCircuit' | 'upperCircuit' | 'bid' | 'ask'>): Stock => {
    const ltp = stock.ltp;
    return {
        ...stock,
        instrumentType: stock.instrumentType || InstrumentType.EQUITY,
        marketDepth: generateMockDepth(ltp),
        bid: ltp - 0.05,
        ask: ltp + 0.05,
        volume: Math.floor(Math.random() * 5000000) + 100000,
        avgTradePrice: ltp * (1 + (Math.random() - 0.5) * 0.005),
        lastTradedQuantity: Math.floor(Math.random() * 500) + 1,
        lastTradedAt: new Date(Date.now() - Math.random() * 10000).toLocaleTimeString('en-GB'),
        lowerCircuit: stock.prevClose * 0.9,
        upperCircuit: stock.prevClose * 1.1,
    };
}


// Constants for the new token economy
export const INITIAL_INR_BALANCE = 0;
export const INITIAL_NXO_BALANCE = 0; // Welcome bonus removed, users must purchase
export const INITIAL_VIRTUAL_BALANCE = 0; // Starting virtual cash is 0, must be converted from NXO

export const MOCK_INDICES: OverviewAsset[] = [
    {
        symbol: 'NIFTY 50',
        name: 'NIFTY 50',
        ltp: 25597.65,
        change: 0.00,
        changePercent: 0.00,
        history: Array.from({ length: 20 }, (_, i) => ({ name: `T-${20-i}`, value: 25500 + Math.sin(i/3) * 100 + Math.random() * 50 }))
    },
    {
        symbol: 'NIFTY BANK',
        name: 'NIFTY BANK',
        ltp: 57827.05,
        change: 0.00,
        changePercent: 0.00,
        history: Array.from({ length: 20 }, (_, i) => ({ name: `T-${20-i}`, value: 57800 + Math.sin(i/4) * 150 + Math.random() * 70 }))
    },
    {
        symbol: 'SENSEX',
        name: 'SENSEX',
        ltp: 83216.28,
        change: 0.00,
        changePercent: 0.00,
        history: Array.from({ length: 20 }, (_, i) => ({ name: `T-${20-i}`, value: 83200 + Math.sin(i/4) * 150 + Math.random() * 70 }))
    }
];

export const MOCK_STOCKS: Stock[] = [
  // Indices
  generateStockDetails({ symbol: 'NIFTY 50', name: 'Nifty 50', exchange: 'INDEX', instrumentType: InstrumentType.INDEX, ltp: 25910.05, open: 25880, high: 25950, low: 25850, prevClose: 25880.00, change: 30.90, changePercent: 0.12 }),
  generateStockDetails({ symbol: 'NIFTY BANK', name: 'Nifty Bank', exchange: 'INDEX', instrumentType: InstrumentType.INDEX, ltp: 58517.20, open: 58400, high: 58600, low: 58350, prevClose: 58381.60, change: 135.60, changePercent: 0.23 }),
  
  // Futures (New)
  generateStockDetails({ symbol: 'NIFTY OCT FUT', name: 'Nifty 50 Futures', exchange: 'NFO', instrumentType: InstrumentType.FUTURE, underlying: 'NIFTY 50', expiryDate: '31 OCT', ltp: 26050.00, open: 26000, high: 26100, low: 25980, prevClose: 26020, change: 30, changePercent: 0.11 }),
  generateStockDetails({ symbol: 'BANKNIFTY OCT FUT', name: 'Bank Nifty Futures', exchange: 'NFO', instrumentType: InstrumentType.FUTURE, underlying: 'NIFTY BANK', expiryDate: '31 OCT', ltp: 58700.00, open: 58600, high: 58800, low: 58500, prevClose: 58650, change: 50, changePercent: 0.08 }),
  
  // Indices continued
  generateStockDetails({ symbol: 'NIFTY NEXT 50', name: 'Nifty Next 50', exchange: 'INDEX', instrumentType: InstrumentType.INDEX, ltp: 69786.85, open: 69850, high: 69900, low: 69700, prevClose: 69851.65, change: -64.80, changePercent: -0.09 }),
  generateStockDetails({ symbol: 'SENSEX', name: 'BSE Sensex', exchange: 'INDEX', instrumentType: InstrumentType.INDEX, ltp: 84562.78, open: 84500, high: 84600, low: 84400, prevClose: 84562.78, change: 0, changePercent: 0 }),
  
  // Stocks
  generateStockDetails({ symbol: 'TATASTEEL', name: 'Tata Steel', exchange: 'NSE', ltp: 181.50, open: 177.00, high: 182.00, low: 176.50, prevClose: 177.27, change: 4.23, changePercent: 2.39 }),
  generateStockDetails({ symbol: 'TCS', name: 'Tata Consultancy', exchange: 'NSE', ltp: 2993.50, open: 3010.00, high: 3015.00, low: 2990.00, prevClose: 3010.90, change: -17.40, changePercent: -0.58 }),
  generateStockDetails({ symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', ltp: 1480.00, open: 1496.00, high: 1498.00, low: 1478.00, prevClose: 1496.10, change: -16.10, changePercent: -1.08 }),
  generateStockDetails({ symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', ltp: 1650.00, open: 1640.00, high: 1660.00, low: 1635.00, prevClose: 1645.00, change: 5.00, changePercent: 0.30 }),
  generateStockDetails({ symbol: 'TECHM', name: 'Tech Mahindra', exchange: 'NSE', ltp: 1387.20, open: 1413.00, high: 1415.00, low: 1385.00, prevClose: 1413.60, change: -26.40, changePercent: -1.87 }),
  generateStockDetails({ symbol: 'TITAN', name: 'Titan Company', exchange: 'NSE', ltp: 3768.00, open: 3774.00, high: 3780.00, low: 3765.00, prevClose: 3774.40, change: -6.40, changePercent: -0.17 }),
  generateStockDetails({ symbol: 'INFY', name: 'Infosys', exchange: 'NSE', ltp: 1478.00, open: 1466.00, high: 1480.00, low: 1465.00, prevClose: 1466.70, change: 11.30, changePercent: 0.77 }),
  generateStockDetails({ symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', ltp: 954.80, open: 960.00, high: 961.00, low: 954.00, prevClose: 960.75, change: -5.95, changePercent: -0.62 }),
];

export const MOCK_NEWS: NewsArticle[] = [
    { id: 'news1', symbol: 'RELIANCE', title: 'Reliance Jio unveils new 5G plans', source: 'Economic Times', snippet: 'Reliance Jio has announced a new set of 5G tariff plans, aiming to accelerate adoption across the country...', timestamp: Date.now() - 3600000 },
    { id: 'news2', symbol: 'RELIANCE', title: 'RIL AGM 2024: Key announcements on green energy and retail', source: 'Livemint', snippet: 'At the annual general meeting, Reliance Industries made significant announcements regarding its push into green energy and expansion of its retail arm.', timestamp: Date.now() - 86400000 },
    { id: 'news3', symbol: 'TCS', title: 'TCS bags multi-million dollar deal from European banking giant', source: 'Business Standard', snippet: 'Tata Consultancy Services has secured a major contract to modernize the IT infrastructure of a leading European bank.', timestamp: Date.now() - 18000000 },
    { id: 'news4', symbol: 'TCS', title: 'IT Sector Q3 Outlook: TCS expected to lead growth', source: 'Reuters', snippet: 'Analysts predict a strong third quarter for the Indian IT sector, with TCS poised to report robust earnings and client acquisitions.', timestamp: Date.now() - 172800000 },
    { id: 'news5', symbol: 'HDFCBANK', title: 'HDFC Bank hikes interest rates on fixed deposits', source: 'Moneycontrol', snippet: 'India\'s largest private sector lender, HDFC Bank, has revised its interest rates on fixed deposits for various tenors, effective today.', timestamp: Date.now() - 43200000 },
    { id: 'news6', symbol: 'INFY', title: 'Infosys partners with AI firm to boost cloud services', source: 'The Hindu Business Line', snippet: 'Infosys has entered into a strategic partnership with a US-based AI company to enhance its suite of cloud-based solutions for enterprise clients.', timestamp: Date.now() - 90000000 },
    { id: 'news7', symbol: 'SBIN', title: 'SBI launches new digital banking platform "YONO 2.0"', source: 'Press Trust of India', snippet: 'State Bank of India is overhauling its digital presence with the launch of YONO 2.0, promising a more integrated and user-friendly experience.', timestamp: Date.now() - 259200000 },
    { id: 'news8', symbol: 'ICICIBANK', title: 'ICICI Bank reports record profit in Q2', source: 'BloombergQuint', snippet: 'ICICI Bank posted its highest-ever quarterly profit, driven by strong loan growth and a reduction in non-performing assets.', timestamp: Date.now() - 60000000 },
];

export const DISCOVER_LISTS: DiscoverList[] = [
  { name: 'Futures & Options', symbols: ['NIFTY OCT FUT', 'BANKNIFTY OCT FUT', 'NIFTY 50', 'NIFTY BANK'] },
  { name: 'Major Indices', symbols: ['NIFTY 50', 'NIFTY NEXT 50', 'NIFTY BANK', 'SENSEX']},
  { name: 'Nifty 50', symbols: MOCK_STOCKS.filter(s => s.exchange !== 'INDEX' && s.instrumentType === InstrumentType.EQUITY).slice(0, 50).map(s => s.symbol) },
];
