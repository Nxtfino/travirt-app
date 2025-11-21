
import React, { useState, useMemo } from 'react';
import { Stock, InstrumentType, TransactionType, OrderType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface OptionChainPanelProps {
    underlyingSymbol: string; // e.g. 'NIFTY 50'
    underlyingLtp: number;
    onOrderAction: (action: { stock: Stock, type: TransactionType, price?: number, orderType?: OrderType }) => void;
    onAddToWatchlist: (stock: Stock) => void;
}

// Helper to generate a mock option contract stock object
const createOptionStock = (underlying: string, strike: number, type: 'CE' | 'PE', underlyingLtp: number): Stock => {
    // Simple Black-Scholes-ish simulation for demo pricing
    const distance = type === 'CE' ? underlyingLtp - strike : strike - underlyingLtp;
    const timeValue = underlyingLtp * 0.005; // Mock time value
    const intrinsicValue = Math.max(0, distance);
    const premium = intrinsicValue + timeValue + (Math.random() * 5); // Add some noise

    const symbol = `${underlying.replace(' ', '')}${type === 'CE' ? 'CE' : 'PE'}${strike}`;
    const name = `${underlying} ${strike} ${type}`;

    return {
        symbol,
        name,
        exchange: 'NFO',
        instrumentType: InstrumentType.OPTION,
        underlying,
        expiryDate: '31 OCT',
        strikePrice: strike,
        optionType: type,
        ltp: premium,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        open: premium * 0.95,
        high: premium * 1.1,
        low: premium * 0.9,
        prevClose: premium * 0.98,
        marketDepth: { bids: [], asks: [] }, // simplified
    };
};

const OptionChainPanel: React.FC<OptionChainPanelProps> = ({ underlyingSymbol, underlyingLtp, onOrderAction, onAddToWatchlist }) => {
    const [expiry, setExpiry] = useState('31 OCT');

    // Generate Strikes
    const strikes = useMemo(() => {
        const step = underlyingSymbol.includes('BANK') ? 100 : 50;
        const centerStrike = Math.round(underlyingLtp / step) * step;
        const numStrikes = 8; // 8 above, 8 below
        
        const strikeList = [];
        for (let i = -numStrikes; i <= numStrikes; i++) {
            strikeList.push(centerStrike + (i * step));
        }
        return strikeList;
    }, [underlyingLtp, underlyingSymbol]);

    // Generate Rows
    const chainRows = useMemo(() => {
        return strikes.map(strike => ({
            strike,
            ce: createOptionStock(underlyingSymbol, strike, 'CE', underlyingLtp),
            pe: createOptionStock(underlyingSymbol, strike, 'PE', underlyingLtp),
        }));
    }, [strikes, underlyingSymbol, underlyingLtp]);

    const CellButton: React.FC<{ stock: Stock, type: 'buy' | 'sell' | 'add' }> = ({ stock, type }) => {
        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (type === 'add') onAddToWatchlist(stock);
            else onOrderAction({ stock, type: type === 'buy' ? TransactionType.BUY : TransactionType.SELL, orderType: OrderType.LIMIT });
        };

        if (type === 'add') {
            return <button onClick={handleClick} className="w-5 h-5 rounded-full hover:bg-overlay text-muted hover:text-primary text-xs"><i className="fas fa-plus"></i></button>;
        }
        
        return (
            <button onClick={handleClick} className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${type === 'buy' ? 'bg-success hover:bg-green-600' : 'bg-danger hover:bg-red-600'}`}>
                {type === 'buy' ? 'B' : 'S'}
            </button>
        );
    };

    return (
        <div className="flex flex-col h-full bg-surface rounded-lg overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-3 border-b border-overlay flex justify-between items-center bg-base">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-text-primary">Option Chain</h3>
                    <div className="text-xs text-muted">
                        Underlying: <span className="text-text-primary font-semibold">{underlyingSymbol}</span> 
                        <span className="ml-2">{formatCurrency(underlyingLtp)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <label className="text-xs text-muted">Expiry</label>
                     <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="bg-overlay border border-gray-600 rounded px-2 py-1 text-xs text-text-primary">
                         <option>31 OCT</option>
                         <option>07 NOV</option>
                         <option>14 NOV</option>
                     </select>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-xs border-collapse relative">
                    <thead className="bg-overlay text-muted sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th colSpan={4} className="p-2 border-r border-gray-700 text-success">CALLS</th>
                            <th className="p-2 bg-base border-x border-gray-700 text-text-primary w-20">STRIKE</th>
                            <th colSpan={4} className="p-2 border-l border-gray-700 text-danger">PUTS</th>
                        </tr>
                        <tr className="text-[10px] uppercase">
                            {/* Calls Header */}
                            <th className="py-1 font-normal">LTP</th>
                            <th className="py-1 font-normal">Chg%</th>
                            <th className="py-1 font-normal">Actions</th>
                            <th className="py-1 font-normal border-r border-gray-700"></th>
                            
                            {/* Strike Header */}
                            <th className="py-1 bg-base border-x border-gray-700"></th>

                            {/* Puts Header */}
                            <th className="py-1 font-normal border-l border-gray-700"></th>
                            <th className="py-1 font-normal">Actions</th>
                            <th className="py-1 font-normal">Chg%</th>
                            <th className="py-1 font-normal">LTP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chainRows.map((row, index) => {
                            // Spot Line Logic
                            const isATM = Math.abs(row.strike - underlyingLtp) < (underlyingSymbol.includes('BANK') ? 50 : 25);
                            const rowBg = isATM ? 'bg-yellow-500/10' : (index % 2 === 0 ? 'bg-surface' : 'bg-base');
                            
                            return (
                                <tr key={row.strike} className={`${rowBg} hover:bg-overlay transition-colors group`}>
                                    {/* CALL SIDE */}
                                    <td className={`text-right p-2 font-semibold ${row.ce.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {row.ce.ltp.toFixed(2)}
                                    </td>
                                    <td className={`text-right p-2 ${row.ce.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {row.ce.changePercent.toFixed(1)}%
                                    </td>
                                    <td className="text-center p-1">
                                        <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CellButton stock={row.ce} type="buy" />
                                            <CellButton stock={row.ce} type="sell" />
                                        </div>
                                    </td>
                                    <td className="text-center p-1 border-r border-gray-700">
                                         <CellButton stock={row.ce} type="add" />
                                    </td>

                                    {/* STRIKE */}
                                    <td className="text-center p-2 font-bold text-text-primary bg-overlay/30 border-x border-gray-700">
                                        {row.strike}
                                    </td>

                                    {/* PUT SIDE */}
                                    <td className="text-center p-1 border-l border-gray-700">
                                        <CellButton stock={row.pe} type="add" />
                                    </td>
                                    <td className="text-center p-1">
                                        <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CellButton stock={row.pe} type="buy" />
                                            <CellButton stock={row.pe} type="sell" />
                                        </div>
                                    </td>
                                    <td className={`text-left p-2 ${row.pe.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {row.pe.changePercent.toFixed(1)}%
                                    </td>
                                    <td className={`text-left p-2 font-semibold ${row.pe.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {row.pe.ltp.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OptionChainPanel;
