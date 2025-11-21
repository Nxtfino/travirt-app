
import React, { useState, useEffect, useMemo } from 'react';
import { Stock, TransactionType, OrderType, Watchlist, DiscoverList, GTTTriggerType, AlertProperty, AlertOperator, AlertType, InstrumentType } from '../types';
// FIX: Changed to a default import to match the export type of WatchlistPanel.
import WatchlistPanel from '../components/trade/WatchlistPanel';
import ChartPanel from '../components/trade/ChartPanel';
import OptionChainPanel from '../components/trade/OptionChainPanel';
import WatchlistTabs from '../components/trade/WatchlistTabs';
import ManageWatchlistsModal from '../components/trade/ManageWatchlistsModal';
import { usePortfolio } from '../contexts/PortfolioContext';
import { formatCurrency } from '../utils/formatters';
import { useWatchlist } from '../contexts/WatchlistContext';
import MarketDepthModal from '../components/trade/MarketDepthModal';

// Alert Create Modal Component
const AlertCreateModal: React.FC<{ stock: Stock, onClose: () => void }> = ({ stock, onClose }) => {
    const { createAlert } = usePortfolio();

    const [property, setProperty] = useState<AlertProperty>(AlertProperty.LTP);
    const [operator, setOperator] = useState<AlertOperator>(AlertOperator.GTE);
    const [value, setValue] = useState(stock.ltp);
    const [alertType, setAlertType] = useState<AlertType>(AlertType.ALERT_ONLY);

    const ltp = stock.ltp;

    const handlePercentChange = (val: string) => {
        const percent = parseFloat(val);
        if (!isNaN(percent)) {
            setValue(ltp * (1 + percent / 100));
        } else {
            setValue(ltp);
        }
    };
    
    const getValuePercent = () => {
        if (property !== AlertProperty.LTP || ltp === 0) return '0.00';
        return (((value - ltp) / ltp) * 100).toFixed(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createAlert({
            symbol: stock.symbol,
            property,
            operator,
            value,
            type: alertType,
        });
        onClose();
    };
    
    const propertyOptions = [
        { value: AlertProperty.LTP, label: 'Last price' },
        { value: AlertProperty.HIGH, label: 'High price' },
        { value: AlertProperty.LOW, label: 'Low price' },
        { value: AlertProperty.OPEN, label: 'Open price' },
        { value: AlertProperty.CLOSE, label: 'Close price' },
        { value: AlertProperty.CHANGE, label: 'Day change' },
        { value: AlertProperty.CHANGE_PERCENT, label: 'Day change %' },
        { value: AlertProperty.VOLUME, label: 'Volume' },
    ];
    
    const operatorOptions = Object.values(AlertOperator);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-2xl w-full max-w-lg border border-overlay" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-overlay flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <i className="fas fa-file-alt text-lg text-muted"></i>
                        <h3 className="font-bold text-lg text-text-primary">{stock.symbol}</h3>
                    </div>
                     <button type="button" className="text-primary hover:underline text-sm font-semibold">Help</button>
                </div>
                 <div className="p-6 space-y-6">
                    {/* Condition Builder */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end text-sm">
                        <span className="md:col-span-1 self-center">If</span>
                        <div className="md:col-span-3">
                            <select value={property} onChange={e => setProperty(e.target.value as AlertProperty)} className="w-full bg-base border border-gray-600 rounded-md p-2">
                               {propertyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                         <span className="md:col-span-1 self-center">of</span>
                        <div className="md:col-span-3">
                             <input type="text" value={`${stock.symbol} (${stock.exchange})`} readOnly className="w-full bg-base border border-gray-600 rounded-md p-2 text-muted"/>
                        </div>
                        <span className="md:col-span-1 self-center">is</span>
                        <div className="md:col-span-1">
                            <select value={operator} onChange={e => setOperator(e.target.value as AlertOperator)} className="w-full bg-base border border-gray-600 rounded-md p-2">
                                {operatorOptions.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                        </div>
                         <span className="md:col-span-1 self-center">than</span>
                         <div className="md:col-span-1">
                            <input type="number" value={value.toFixed(2)} onChange={e => setValue(parseFloat(e.target.value))} step="0.05" className="w-full bg-base border border-gray-600 rounded-md p-2" />
                        </div>
                    </div>
                    <div className="flex justify-end items-center gap-2 -mt-2">
                         <p className="text-xs text-muted mr-2">Last price: {formatCurrency(stock.ltp)}</p>
                         <input type="number" step="0.01" onChange={e => handlePercentChange(e.target.value)} value={getValuePercent()} className="w-20 bg-base border border-gray-600 rounded-md p-1 text-xs text-center"/>
                         <span className="text-xs text-muted">% of Last price</span>
                    </div>

                    {/* Alert Type */}
                    <div>
                        <div className="flex gap-6">
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="alertType" value={AlertType.ALERT_ONLY} checked={alertType === AlertType.ALERT_ONLY} onChange={() => setAlertType(AlertType.ALERT_ONLY)} className="h-4 w-4 text-primary bg-base border-gray-500" />
                                <span className="ml-2">Only alert</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="alertType" value={AlertType.ATO} checked={alertType === AlertType.ATO} onChange={() => setAlertType(AlertType.ATO)} className="h-4 w-4 text-primary bg-base border-gray-500"/>
                                <span className="ml-2">Alert Triggers Order (ATO)</span>
                            </label>
                        </div>
                    </div>
                    
                    {alertType === AlertType.ATO && (
                        <div className="text-center p-8 bg-overlay/50 rounded-md text-muted border border-dashed border-gray-600">
                             <i className="fas fa-box-open text-3xl mb-3"></i>
                            <p>ATO Basket creation is coming soon!</p>
                            <p className="text-xs">This will allow you to execute a basket of orders when the alert triggers.</p>
                        </div>
                    )}

                </div>
                 <div className="p-4 border-t border-overlay flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-8 py-2 rounded-md bg-overlay hover:bg-base text-text-primary font-semibold transition">Cancel</button>
                    <button type="submit" className="px-8 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition">Create</button>
                </div>
            </form>
        </div>
    );
};


// GTT Create Modal Component
const GTTCreateModal: React.FC<{ stock: Stock, onClose: () => void }> = ({ stock, onClose }) => {
    const { createGTT } = usePortfolio();

    const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.BUY);
    const [triggerType, setTriggerType] = useState<GTTTriggerType>(GTTTriggerType.SINGLE);
    
    // Single Trigger State
    const [triggerPrice, setTriggerPrice] = useState(stock.ltp);
    const [quantity, setQuantity] = useState(1);
    const [limitPrice, setLimitPrice] = useState(stock.ltp);

    // OCO State
    const [stoplossTrigger, setStoplossTrigger] = useState(stock.ltp * 0.95);
    const [targetTrigger, setTargetTrigger] = useState(stock.ltp * 1.05);

    const [agreed, setAgreed] = useState(false);

    const ltp = stock.ltp;

    useEffect(() => {
        if (triggerType === GTTTriggerType.OCO) {
            setTransactionType(TransactionType.SELL);
        }
    }, [triggerType]);
    
    const handlePercentChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string) => {
        const percent = parseFloat(value);
        if (!isNaN(percent)) {
            setter(ltp * (1 + percent / 100));
        }
    };
    
    const getPercent = (price: number) => {
        return ltp > 0 ? ((price - ltp) / ltp * 100).toFixed(2) : '0.00';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            alert("Please agree to the terms and conditions.");
            return;
        }

        if (triggerType === GTTTriggerType.SINGLE) {
            createGTT({
                symbol: stock.symbol,
                transactionType,
                triggerType,
                quantity,
                triggerPrice,
                limitPrice,
            });
        } else { // OCO
             createGTT({
                symbol: stock.symbol,
                transactionType: TransactionType.SELL,
                triggerType,
                quantity,
                stoplossTriggerPrice: stoplossTrigger,
                stoplossLimitPrice: stoplossTrigger, // Simplified for demo
                targetTriggerPrice: targetTrigger,
                targetLimitPrice: targetTrigger, // Simplified for demo
            });
        }
        onClose();
    };

    const triggerTypeDescription = triggerType === GTTTriggerType.SINGLE
        ? "The order is placed when the Last Traded Price (LTP) crosses the trigger price. Used to buy or sell stock holdings."
        : "One Cancels Other: Either the stoploss or the target order is placed when the LTP crosses the respective trigger. Used to set target and stoploss for stock holdings.";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-2xl w-full max-w-md border border-overlay" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-overlay flex justify-between items-center">
                    <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-lg text-text-primary">{stock.symbol}</h3>
                        <span className="text-sm font-semibold text-primary">{stock.exchange}</span>
                        <span className="text-sm text-muted">{formatCurrency(stock.ltp)}</span>
                    </div>
                     <i className="fas fa-info-circle text-primary text-lg"></i>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Transaction & Trigger Type */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-semibold mb-2 block">Transaction type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input type="radio" name="transactionType" value={TransactionType.BUY} checked={transactionType === TransactionType.BUY} onChange={() => setTransactionType(TransactionType.BUY)} disabled={triggerType === GTTTriggerType.OCO} className="h-4 w-4 text-primary bg-base border-gray-500" />
                                    <span className="ml-2">Buy</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="transactionType" value={TransactionType.SELL} checked={transactionType === TransactionType.SELL} onChange={() => setTransactionType(TransactionType.SELL)} className="h-4 w-4 text-primary bg-base border-gray-500"/>
                                    <span className="ml-2">Sell</span>
                                </label>
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-semibold mb-2 block">Trigger type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input type="radio" name="triggerType" value={GTTTriggerType.SINGLE} checked={triggerType === GTTTriggerType.SINGLE} onChange={() => setTriggerType(GTTTriggerType.SINGLE)} className="h-4 w-4 text-primary bg-base border-gray-500"/>
                                    <span className="ml-2">Single</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="triggerType" value={GTTTriggerType.OCO} checked={triggerType === GTTTriggerType.OCO} onChange={() => setTriggerType(GTTTriggerType.OCO)} className="h-4 w-4 text-primary bg-base border-gray-500"/>
                                    <span className="ml-2">OCO</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted">{triggerTypeDescription}</p>

                    {/* Form fields based on trigger type */}
                    {triggerType === GTTTriggerType.SINGLE && (
                        <div className="grid grid-cols-5 items-end gap-3 p-4 bg-overlay/50 rounded-md">
                            <div className="col-span-2">
                                <label className="text-xs text-muted">Trigger price</label>
                                <input type="number" value={triggerPrice.toFixed(2)} onChange={e => setTriggerPrice(parseFloat(e.target.value))} step="0.05" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1 text-sm"/>
                                <input type="text" value={getPercent(triggerPrice)} onChange={e => handlePercentChange(setTriggerPrice, e.target.value)} className="w-full bg-transparent text-center text-xs text-primary mt-1" placeholder="% of LTP" />
                            </div>
                            <div className="text-center text-muted col-span-1 pb-2">&rarr;</div>
                            <div className="col-span-1">
                                <label className="text-xs text-muted">Qty.</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} min="1" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1 text-sm"/>
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs text-muted">Price</label>
                                <input type="number" value={limitPrice.toFixed(2)} onChange={e => setLimitPrice(parseFloat(e.target.value))} step="0.05" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1 text-sm"/>
                            </div>
                        </div>
                    )}

                    {triggerType === GTTTriggerType.OCO && (
                        <div className="space-y-3">
                            {/* Stoploss */}
                             <div className="grid grid-cols-5 items-end gap-3 p-4 bg-overlay/50 rounded-md">
                                <label className="text-sm font-semibold text-purple-400 col-span-5">Stoploss</label>
                                <div className="col-span-2">
                                    <label className="text-xs text-muted">Trigger price</label>
                                    <input type="number" value={stoplossTrigger.toFixed(2)} onChange={e => setStoplossTrigger(parseFloat(e.target.value))} step="0.05" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1 text-sm"/>
                                    <input type="text" value={getPercent(stoplossTrigger)} onChange={e => handlePercentChange(setStoplossTrigger, e.target.value)} className="w-full bg-transparent text-center text-xs text-primary mt-1" placeholder="% of LTP" />
                                </div>
                                <div className="text-center text-muted col-span-1 pb-2">&rarr;</div>
                                <div className="col-span-1">
                                    <label className="text-xs text-muted">Qty.</label>
                                    <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} min="1" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1 text-sm"/>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs text-muted">Price</label>
                                    <input type="number" value={stoplossTrigger.toFixed(2)} readOnly className="w-full bg-base/50 border border-gray-700 rounded-md p-2 mt-1 text-sm text-muted"/>
                                </div>
                            </div>
                            {/* Target */}
                             <div className="grid grid-cols-5 items-end gap-3 p-4 bg-overlay/50 rounded-md">
                                 <label className="text-sm font-semibold text-purple-400 col-span-5">Target</label>
                                <div className="col-span-2">
                                    <label className="text-xs text-muted">Trigger price</label>
                                    <input type="number" value={targetTrigger.toFixed(2)} onChange={e => setTargetTrigger(parseFloat(e.target.value))} step="0.05" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1 text-sm"/>
                                    <input type="text" value={getPercent(targetTrigger)} onChange={e => handlePercentChange(setTargetTrigger, e.target.value)} className="w-full bg-transparent text-center text-xs text-primary mt-1" placeholder="% of LTP" />
                                </div>
                                <div className="text-center text-muted col-span-1 pb-2">&rarr;</div>
                                <div className="col-span-1">
                                    <label className="text-xs text-muted">Qty.</label>
                                    <input type="number" value={quantity} readOnly className="w-full bg-base/50 border border-gray-700 rounded-md p-2 mt-1 text-sm text-muted"/>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs text-muted">Price</label>
                                    <input type="number" value={targetTrigger.toFixed(2)} readOnly className="w-full bg-base/50 border border-gray-700 rounded-md p-2 mt-1 text-sm text-muted"/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-overlay">
                     <div className="flex items-start">
                        <input type="checkbox" id="gtt-terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-primary focus:ring-primary mt-1"/>
                        <label htmlFor="gtt-terms" className="ml-2 text-xs text-muted">
                            I agree to the <a href="#" className="text-primary hover:underline">terms</a> and accept that trigger executions are not guaranteed. This trigger expires on {new Date(Date.now() + 31536000000).toLocaleDateString('en-CA')}.
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-8 py-2 rounded-md bg-overlay hover:bg-base text-text-primary font-semibold transition">Cancel</button>
                        <button type="submit" className="px-8 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition">Place</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

// OrderPanel component remains the same for placing trades
interface OrderPanelProps {
    initialSymbol?: string;
    initialTransactionType: TransactionType;
    initialPrice?: number;
    initialOrderType?: OrderType;
    stock?: Stock; // Direct stock injection for simulated F&O
    onClose: () => void;
}

const OrderPanel: React.FC<OrderPanelProps> = ({ initialSymbol, initialTransactionType, initialPrice, initialOrderType, stock: injectedStock, onClose }) => {
    const { getStock, executeTrade, executeBracketOrder, portfolio } = usePortfolio();
    // If we have injected stock (like from Option Chain), use it. Otherwise lookup by symbol.
    const stock = injectedStock || (initialSymbol ? getStock(initialSymbol) : undefined);
    const symbol = stock?.symbol || initialSymbol || '';

    const [transactionType, setTransactionType] = useState<TransactionType>(initialTransactionType);
    const [orderType, setOrderType] = useState<OrderType>(initialOrderType || OrderType.MARKET);
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(initialPrice || 0);
    const [stopLoss, setStopLoss] = useState(0);
    const [takeProfit, setTakeProfit] = useState(0);
    const [isBracketOrder, setIsBracketOrder] = useState(false);

    useEffect(() => {
        if (stock) {
            setPrice(initialPrice || stock.ltp);
            if(initialOrderType) setOrderType(initialOrderType);
        }
    }, [stock, initialPrice, initialOrderType]);
    
    useEffect(() => {
        setTransactionType(initialTransactionType);
    }, [initialTransactionType]);
    
    if (!stock) {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
                <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-md">
                    <p>Loading stock data or stock not found...</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white rounded">Close</button>
                </div>
            </div>
        );
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const mainOrder = {
            symbol,
            quantity,
            price: orderType === OrderType.LIMIT ? price : undefined,
            orderType,
            transactionType
        };

        let success = false;
        if (isBracketOrder) {
            if (stopLoss > 0 && takeProfit > 0) {
                 success = executeBracketOrder(mainOrder, stopLoss, takeProfit);
            } else {
                alert('Please set Stop Loss and Take Profit for a bracket order.');
                return;
            }
        } else {
            success = executeTrade(mainOrder);
        }

        if (success) {
            onClose();
        }
    };

    const tradeValue = quantity * (orderType === OrderType.LIMIT ? price : stock.ltp);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-2xl w-full max-w-sm border border-overlay animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-overlay flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-text-primary">Place Order</h3>
                    <button onClick={onClose} className="text-muted hover:text-text-primary text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="flex justify-between items-baseline">
                         <h4 className="text-xl font-bold truncate max-w-[200px]" title={stock.symbol}>{stock.symbol}</h4>
                         <p className="text-sm text-muted">LTP: {formatCurrency(stock.ltp)}</p>
                    </div>

                    <div className="flex bg-overlay rounded-md p-1">
                        <button type="button" onClick={() => setTransactionType(TransactionType.BUY)} className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${transactionType === TransactionType.BUY ? 'bg-success text-white' : 'text-muted hover:bg-base'}`}>BUY</button>
                        <button type="button" onClick={() => setTransactionType(TransactionType.SELL)} className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${transactionType === TransactionType.SELL ? 'bg-danger text-white' : 'text-muted hover:bg-base'}`}>SELL</button>
                    </div>

                     <div>
                        <label className="text-xs text-muted">Quantity</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} min="1" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1"/>
                    </div>
                     <div>
                        <label className="text-xs text-muted">Order Type</label>
                         <div className="flex gap-2 mt-1">
                            <button type="button" onClick={() => setOrderType(OrderType.MARKET)} className={`px-3 py-1 text-xs rounded ${orderType === OrderType.MARKET ? 'bg-primary text-white' : 'bg-base text-muted'}`}>Market</button>
                            <button type="button" onClick={() => setOrderType(OrderType.LIMIT)} className={`px-3 py-1 text-xs rounded ${orderType === OrderType.LIMIT ? 'bg-primary text-white' : 'bg-base text-muted'}`}>Limit</button>
                        </div>
                    </div>
                    
                    {orderType === OrderType.LIMIT && (
                         <div>
                            <label className="text-xs text-muted">Price</label>
                            <input type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} step="0.05" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1"/>
                        </div>
                    )}
                    
                    <div>
                         <div className="flex items-center">
                            <input type="checkbox" id="bracket-order" checked={isBracketOrder} onChange={e => setIsBracketOrder(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-primary focus:ring-primary"/>
                            <label htmlFor="bracket-order" className="ml-2 text-sm">Bracket Order (Stop Loss & Take Profit)</label>
                        </div>
                    </div>

                     {isBracketOrder && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted">Stop Loss</label>
                                <input type="number" value={stopLoss} onChange={e => setStopLoss(parseFloat(e.target.value) || 0)} step="0.05" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1"/>
                            </div>
                             <div>
                                <label className="text-xs text-muted">Take Profit</label>
                                <input type="number" value={takeProfit} onChange={e => setTakeProfit(parseFloat(e.target.value) || 0)} step="0.05" className="w-full bg-base border border-gray-600 rounded-md p-2 mt-1"/>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-overlay pt-4">
                         <div className="flex justify-between text-sm">
                            <span className="text-muted">Est. Value</span>
                            <span>{formatCurrency(tradeValue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Balance</span>
                            <span>{formatCurrency(portfolio.virtualBalance)}</span>
                        </div>
                    </div>

                    <button type="submit" className={`w-full font-semibold py-3 rounded-md text-white transition ${transactionType === TransactionType.BUY ? 'bg-success hover:bg-green-600' : 'bg-danger hover:bg-red-600'}`}>
                        {transactionType === TransactionType.BUY ? 'Place Buy Order' : 'Place Sell Order'}
                    </button>

                </form>
            </div>
        </div>
    )
}

const TradeScreen: React.FC = () => {
    const { marketData, getStock } = usePortfolio();
    const { watchlists, activeView, addStockToGroup } = useWatchlist();

    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [orderAction, setOrderAction] = useState<{stock: Stock, type: TransactionType, price?: number, orderType?: OrderType} | null>(null);
    const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [gttModalStock, setGttModalStock] = useState<Stock | null>(null);
    const [alertModalStock, setAlertModalStock] = useState<Stock | null>(null);
    const [marketDepthModalStock, setMarketDepthModalStock] = useState<Stock | null>(null);
    
    // State to toggle Option Chain View
    const [showOptionChain, setShowOptionChain] = useState(false);


    const activeContent = useMemo(() => {
        if (activeView.type === 'watchlist') {
            const wl = watchlists.find(w => w.id === activeView.id);
            if (!wl) return null;
            return { list: wl, isDiscover: false };
        } else { // discover
            const discoverListAsWatchlist: Watchlist = {
                id: -1, // temporary ID
                name: activeView.list.name,
                groups: [{ id: 'discover-default', name: 'Default', symbols: activeView.list.symbols, isCollapsed: false, isMaximized: false }],
                settings: { // Use a default, non-persistent setting object for discover lists
                    changeType: 'close',
                    showOptions: { priceChange: true, priceChangePercent: true, priceDirection: true, holdings: false, notes: false, groupColors: false },
                    sortBy: 'LTP',
                }
            };
            return { list: discoverListAsWatchlist, isDiscover: true };
        }
    }, [activeView, watchlists]);

    const handleOrderAction = (action: { stock: Stock, type: TransactionType, price?: number, orderType?: OrderType }) => {
        setOrderAction(action);
        setIsOrderPanelOpen(true);
    };

    const handleCreateGTT = (symbol: string) => {
        const stock = getStock(symbol);
        if (stock) {
            setGttModalStock(stock);
        }
    };
    
    const handleCreateGTTFromModal = (stock: Stock) => {
        setMarketDepthModalStock(null);
        setGttModalStock(stock);
    };

    const handleCreateAlert = (symbol: string) => {
        const stock = getStock(symbol);
        if (stock) {
            setAlertModalStock(stock);
        }
    };
    
    const handleShowMarketDepthModal = (symbol: string) => {
        const stock = getStock(symbol);
        if (stock) {
            setMarketDepthModalStock(stock);
        }
    };
    
    // Handler to add simulated option stock to watchlist
    const handleAddOptionToWatchlist = (stock: Stock) => {
         // We need a real implementation here, but since simulated stocks don't exist in marketData context, 
         // this would require upgrading the Context to handle ephemeral stocks.
         // For this demo, we will just alert.
         alert(`Added ${stock.symbol} to Watchlist (Simulated)`);
    };


    useEffect(() => {
        // Set an initial stock once data is loaded
        if (!selectedStock && marketData.length > 0) {
            // Default to a specific stock if available, otherwise the first one
            const defaultStock = marketData.find(s => s.symbol === 'TATASTEEL');
            setSelectedStock(defaultStock || marketData[0]);
        }
        // Update selected stock with new data from the stream
        if (selectedStock && selectedStock.instrumentType !== InstrumentType.OPTION) {
            const updatedStock = marketData.find(s => s.symbol === selectedStock.symbol);
            if (updatedStock) {
                setSelectedStock(updatedStock);
            }
        }
    }, [marketData, selectedStock]);

    useEffect(() => {
        if (orderAction) {
            setSelectedStock(orderAction.stock);
        }
    }, [orderAction]);

    return (
        <main className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-4 gap-4 h-full p-4 overflow-hidden">
            {/* Left Panel: Watchlist */}
            <div className="lg:col-span-1 xl:col-span-1 shadow-lg flex flex-col h-full overflow-hidden bg-surface rounded-lg">
                <div className="flex-1 min-h-0">
                    {activeContent ? (
                        <WatchlistPanel
                            activeList={activeContent.list}
                            isDiscover={activeContent.isDiscover}
                            selectedStock={selectedStock}
                            onStockSelect={setSelectedStock}
                            onOrderAction={handleOrderAction}
                            onCreateGTT={handleCreateGTT}
                            onCreateAlert={handleCreateAlert}
                            onShowMarketDepthModal={handleShowMarketDepthModal}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted h-full">
                            Loading Watchlist...
                        </div>
                    )}
                </div>
                 <div className="shrink-0">
                    <WatchlistTabs onManageClick={() => setIsManageModalOpen(true)} />
                </div>
            </div>

            {/* Main Panel: Chart & Info or Option Chain */}
            <div className="lg:col-span-4 xl:col-span-3 bg-surface rounded-lg shadow-lg p-4 flex flex-col min-w-0 relative">
                {selectedStock ? (
                    <>
                        {/* F&O Toggle Bar */}
                        {(selectedStock.exchange === 'INDEX' || selectedStock.instrumentType === InstrumentType.INDEX || selectedStock.instrumentType === InstrumentType.FUTURE) && (
                            <div className="absolute top-4 right-4 z-10 flex gap-2 bg-base/80 p-1 rounded-md border border-overlay">
                                <button 
                                    onClick={() => setShowOptionChain(false)} 
                                    className={`px-3 py-1 text-xs font-bold rounded ${!showOptionChain ? 'bg-primary text-white' : 'text-muted hover:text-text-primary'}`}
                                >
                                    Chart
                                </button>
                                <button 
                                    onClick={() => setShowOptionChain(true)} 
                                    className={`px-3 py-1 text-xs font-bold rounded ${showOptionChain ? 'bg-primary text-white' : 'text-muted hover:text-text-primary'}`}
                                >
                                    Option Chain
                                </button>
                            </div>
                        )}

                        {showOptionChain && (selectedStock.exchange === 'INDEX' || selectedStock.instrumentType === InstrumentType.INDEX || selectedStock.instrumentType === InstrumentType.FUTURE) ? (
                             <OptionChainPanel 
                                underlyingSymbol={selectedStock.instrumentType === InstrumentType.FUTURE ? selectedStock.underlying! : selectedStock.symbol}
                                underlyingLtp={selectedStock.ltp}
                                onOrderAction={handleOrderAction}
                                onAddToWatchlist={handleAddOptionToWatchlist}
                            />
                        ) : (
                            <ChartPanel stock={selectedStock} />
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted">Select a stock to view its chart</div>
                )}
            </div>
            
            {/* Floating Order Panel */}
            {isOrderPanelOpen && orderAction && (
                 <OrderPanel 
                    key={`${orderAction.stock.symbol}-${orderAction.price}-${orderAction.type}`} 
                    initialSymbol={orderAction.stock.symbol} 
                    initialTransactionType={orderAction.type}
                    initialPrice={orderAction.price}
                    initialOrderType={orderAction.orderType}
                    stock={orderAction.stock} // Pass the stock object directly (crucial for simulated F&O)
                    onClose={() => setIsOrderPanelOpen(false)}
                />
            )}

            {/* GTT Creation Modal */}
            {gttModalStock && <GTTCreateModal stock={gttModalStock} onClose={() => setGttModalStock(null)} />}

            {/* Alert Creation Modal */}
            {alertModalStock && <AlertCreateModal stock={alertModalStock} onClose={() => setAlertModalStock(null)} />}
            
            {/* Market Depth Modal */}
            {marketDepthModalStock && (
                <MarketDepthModal
                    stock={marketDepthModalStock}
                    marketData={marketData}
                    onClose={() => setMarketDepthModalStock(null)}
                    onOrderAction={(action) => {
                        setMarketDepthModalStock(null);
                        handleOrderAction(action);
                    }}
                    onCreateGTT={handleCreateGTTFromModal}
                />
            )}

            {/* Manage Watchlists Modal */}
            {isManageModalOpen && <ManageWatchlistsModal onClose={() => setIsManageModalOpen(false)} />}
        </main>
    );
};

export default TradeScreen;
