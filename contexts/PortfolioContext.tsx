
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { PortfolioState, Position, Order, TransactionType, OrderType, Stock, Transaction, GTTOrder, GTTStatus, GTTTriggerType, Alert, AlertStatus } from '../types';
import { useMarketData } from '../hooks/useMarketData';
import { formatCurrency } from '../utils/formatters';
import { INITIAL_INR_BALANCE, INITIAL_NXO_BALANCE, INITIAL_VIRTUAL_BALANCE } from '../constants';

interface PortfolioContextType {
    portfolio: PortfolioState;
    executeTrade: (order: Omit<Order, 'id' | 'timestamp' | 'status'>) => boolean;
    executeBracketOrder: (mainOrder: Omit<Order, 'id' | 'timestamp' | 'status'>, stopLossPrice: number, takeProfitPrice: number) => boolean;
    createGTT: (gttData: Omit<GTTOrder, 'id' | 'createdAt' | 'expiresAt' | 'status'>) => void;
    deleteGTT: (gttId: string) => void;
    createAlert: (alertData: Omit<Alert, 'id' | 'createdAt' | 'expiresAt' | 'status'>) => void;
    deleteAlert: (alertId: string) => void;
    getStock: (symbol: string) => Stock | undefined;
    marketData: Stock[];
    loading: boolean;
    addInr: (amount: number) => void;
    buyNfino: (inrAmount: number) => boolean;
    convertNfinoToVirtual: (nxoAmount: number) => boolean;
    claimDailyBonus: () => boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode; setShowRefillPrompt: (show: boolean) => void }> = ({ children, setShowRefillPrompt }) => {
    const { marketData, loading } = useMarketData();
    const [portfolio, setPortfolio] = useState<PortfolioState>({
        inrBalance: INITIAL_INR_BALANCE,
        nxoBalance: INITIAL_NXO_BALANCE,
        virtualBalance: INITIAL_VIRTUAL_BALANCE,
        positions: [],
        orderHistory: [],
        transactionHistory: [],
        gttOrders: [],
        alerts: [],
        totalInvested: 0,
        totalCurrentValue: 0,
        totalPnl: 0,
        todayPnl: 0,
        marginUsed: 0,
        dailyBonusClaimed: false,
    });

    const getStock = useCallback((symbol: string) => marketData.find(s => s.symbol === symbol), [marketData]);

    const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
        setPortfolio(p => ({
            ...p,
            transactionHistory: [
                { ...transaction, id: `txn_${Date.now()}`, timestamp: Date.now() },
                ...p.transactionHistory
            ]
        }));
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (marketData.length > 0) {
                setPortfolio(prev => {
                    let totalInvested = 0;
                    let totalCurrentValue = 0;
                    
                    const updatedPositions = prev.positions.map(pos => {
                        const stock = getStock(pos.symbol);
                        if (stock) {
                            const currentValue = pos.quantity * stock.ltp;
                            const investedValue = pos.quantity * pos.avgPrice;
                            const pnl = currentValue - investedValue;

                            totalInvested += investedValue;
                            totalCurrentValue += currentValue;
                            
                            return {
                                ...pos,
                                ltp: stock.ltp,
                                pnl,
                                currentValue,
                                investedValue,
                            };
                        }
                        return pos;
                    });
                    
                    const totalPnl = totalCurrentValue - totalInvested;
                    const todayPnl = updatedPositions.reduce((acc, pos) => {
                        const stock = getStock(pos.symbol);
                        return acc + (stock ? (stock.ltp - stock.prevClose) * pos.quantity : 0);
                    }, 0);
                    
                    return {
                        ...prev,
                        positions: updatedPositions,
                        totalInvested,
                        totalCurrentValue,
                        totalPnl,
                        todayPnl,
                        marginUsed: totalInvested, // Simplified margin
                    };
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [marketData, getStock]);
    
    const addInr = useCallback((amount: number) => {
        if (amount > 0) {
            setPortfolio(p => ({ ...p, inrBalance: p.inrBalance + amount }));
            addTransaction({ type: 'DEPOSIT_INR', description: 'Added funds to wallet', amount: `+ ${formatCurrency(amount)}` });
        }
    }, []);

    const buyNfino = useCallback((inrAmount: number): boolean => {
        if (inrAmount <= 0) return false;
        if (portfolio.inrBalance < inrAmount) {
            alert('Insufficient INR balance.');
            return false;
        }
        setPortfolio(p => ({
            ...p,
            inrBalance: p.inrBalance - inrAmount,
            nxoBalance: p.nxoBalance + inrAmount, // 1:1 conversion
        }));
        addTransaction({ type: 'BUY_NXO', description: `Purchased ${inrAmount} NXO`, amount: `- ${formatCurrency(inrAmount)}` });
        return true;
    }, [portfolio.inrBalance]);

    const convertNfinoToVirtual = useCallback((nxoAmount: number): boolean => {
        if (nxoAmount <= 0) return false;
        if (portfolio.nxoBalance < nxoAmount) {
            alert('Insufficient NFINO (NXO) balance.');
            return false;
        }
        setPortfolio(p => ({
            ...p,
            nxoBalance: p.nxoBalance - nxoAmount,
            virtualBalance: p.virtualBalance + nxoAmount * 1000, // 1 NXO = 1000 Virtual
        }));
        addTransaction({ type: 'CONVERT_NXO', description: `Converted ${nxoAmount} NXO`, amount: `+ ${formatCurrency(nxoAmount * 1000)} Virtual` });
        return true;
    }, [portfolio.nxoBalance]);

    const claimDailyBonus = useCallback((): boolean => {
        if (portfolio.dailyBonusClaimed) {
            alert("You have already claimed today's login bonus.");
            return false;
        }
        const bonusAmount = 10; // 10 NXO
        setPortfolio(p => ({
            ...p,
            nxoBalance: p.nxoBalance + bonusAmount,
            dailyBonusClaimed: true,
        }));
        addTransaction({ type: 'REWARD_NXO', description: 'Daily Login Bonus', amount: `+ ${bonusAmount} NXO` });
        return true;
    }, [portfolio.dailyBonusClaimed]);

    const executeTrade = useCallback((order: Omit<Order, 'id' | 'timestamp' | 'status'>): boolean => {
        const stock = getStock(order.symbol);
        if (!stock) return false;

        const price = order.orderType === OrderType.LIMIT && order.price ? order.price : stock.ltp;
        const tradeValue = order.quantity * price;
        
        if (order.transactionType === TransactionType.BUY) {
            if (portfolio.virtualBalance < tradeValue) {
                setShowRefillPrompt(true);
                return false;
            }
        } else { // SELL
            const existingPosition = portfolio.positions.find(p => p.symbol === order.symbol);
            if (!existingPosition) {
                alert("You don't own this stock to sell.");
                return false;
            }
            if (existingPosition.quantity < order.quantity) {
                alert('You cannot sell more shares than you own.');
                return false;
            }
        }

        setPortfolio(prev => {
            const newPortfolio = { ...prev };
            let positions = [...newPortfolio.positions];
            const existingPositionIndex = positions.findIndex(p => p.symbol === order.symbol);

            if (order.transactionType === TransactionType.BUY) {
                newPortfolio.virtualBalance -= tradeValue;

                if (existingPositionIndex > -1) {
                    const existingPosition = positions[existingPositionIndex];
                    const totalQuantity = existingPosition.quantity + order.quantity;
                    const newAvgPrice = ((existingPosition.avgPrice * existingPosition.quantity) + tradeValue) / totalQuantity;
                    positions[existingPositionIndex] = {
                        ...existingPosition,
                        quantity: totalQuantity,
                        avgPrice: newAvgPrice,
                    };
                } else {
                    positions.push({
                        symbol: order.symbol,
                        quantity: order.quantity,
                        avgPrice: price,
                        ltp: stock.ltp,
                        pnl: 0,
                        investedValue: tradeValue,
                        currentValue: tradeValue,
                    });
                }
            } else { // SELL
                const existingPosition = positions[existingPositionIndex];
                newPortfolio.virtualBalance += tradeValue;
                
                if (existingPosition.quantity === order.quantity) {
                    positions.splice(existingPositionIndex, 1);
                } else {
                    existingPosition.quantity -= order.quantity;
                }
            }
            newPortfolio.positions = positions;

            const executedOrder: Order = {
                ...order,
                id: `ord_${Date.now()}`,
                timestamp: Date.now(),
                status: 'EXECUTED',
                price: price,
            };
            newPortfolio.orderHistory = [executedOrder, ...newPortfolio.orderHistory];
            
            return newPortfolio;
        });
        return true;
    }, [getStock, portfolio.virtualBalance, portfolio.positions, setShowRefillPrompt]);

    const executeBracketOrder = useCallback((
        mainOrder: Omit<Order, 'id' | 'timestamp' | 'status'>,
        stopLossPrice: number,
        takeProfitPrice: number
    ): boolean => {
        const stock = getStock(mainOrder.symbol);
        if (!stock) return false;

        const price = mainOrder.orderType === OrderType.LIMIT && mainOrder.price ? mainOrder.price : stock.ltp;
        const tradeValue = mainOrder.quantity * price;
        
        if (mainOrder.transactionType === TransactionType.BUY) {
            if (portfolio.virtualBalance < tradeValue) {
                setShowRefillPrompt(true);
                return false;
            }
        } else { // SELL
            const existingPosition = portfolio.positions.find(p => p.symbol === mainOrder.symbol);
            if (!existingPosition) {
                alert("You don't own this stock.");
                return false;
            }
            if (existingPosition.quantity < mainOrder.quantity) {
                alert('Cannot sell more than you own.');
                return false;
            }
        }

        setPortfolio(prev => {
            const newPortfolio = { ...prev };
            let positions = [...newPortfolio.positions];
            const existingPositionIndex = positions.findIndex(p => p.symbol === mainOrder.symbol);

            if (mainOrder.transactionType === TransactionType.BUY) {
                newPortfolio.virtualBalance -= tradeValue;
                if (existingPositionIndex > -1) {
                    const pos = positions[existingPositionIndex];
                    const totalQty = pos.quantity + mainOrder.quantity;
                    const newAvg = ((pos.avgPrice * pos.quantity) + tradeValue) / totalQty;
                    positions[existingPositionIndex] = { ...pos, quantity: totalQty, avgPrice: newAvg };
                } else {
                    positions.push({ symbol: mainOrder.symbol, quantity: mainOrder.quantity, avgPrice: price, ltp: stock.ltp, pnl: 0, investedValue: tradeValue, currentValue: tradeValue });
                }
            } else { // SELL
                const pos = positions[existingPositionIndex];
                newPortfolio.virtualBalance += tradeValue;
                if (pos.quantity === mainOrder.quantity) {
                    positions.splice(existingPositionIndex, 1);
                } else {
                    pos.quantity -= mainOrder.quantity;
                }
            }
            newPortfolio.positions = positions;

            const executedOrder: Order = {
                ...mainOrder,
                id: `ord_${Date.now()}`,
                timestamp: Date.now(),
                status: 'EXECUTED',
                price: price,
            };

            const pendingOrderTxType = mainOrder.transactionType === TransactionType.BUY ? TransactionType.SELL : TransactionType.BUY;
            const stopLossOrder: Order = {
                id: `ord_sl_${Date.now()}`,
                symbol: mainOrder.symbol,
                quantity: mainOrder.quantity,
                price: stopLossPrice,
                orderType: OrderType.STOP_LOSS_MARKET,
                transactionType: pendingOrderTxType,
                timestamp: Date.now(),
                status: 'PENDING',
            };
            const takeProfitOrder: Order = {
                id: `ord_tp_${Date.now()}`,
                symbol: mainOrder.symbol,
                quantity: mainOrder.quantity,
                price: takeProfitPrice,
                orderType: OrderType.TAKE_PROFIT_MARKET,
                transactionType: pendingOrderTxType,
                timestamp: Date.now(),
                status: 'PENDING',
            };

            newPortfolio.orderHistory = [executedOrder, stopLossOrder, takeProfitOrder, ...newPortfolio.orderHistory];
            return newPortfolio;
        });
        return true;
    }, [getStock, portfolio.virtualBalance, portfolio.positions, setShowRefillPrompt]);
    
    // --- GTT LOGIC ---
    const createGTT = useCallback((gttData: Omit<GTTOrder, 'id' | 'createdAt' | 'expiresAt' | 'status'>) => {
        const newGTT: GTTOrder = {
            ...gttData,
            id: `gtt_${Date.now()}`,
            createdAt: Date.now(),
            expiresAt: Date.now() + 31536000000, // 1 year validity
            status: GTTStatus.ACTIVE,
        };
        setPortfolio(p => ({ ...p, gttOrders: [newGTT, ...p.gttOrders] }));
    }, []);

    const deleteGTT = useCallback((gttId: string) => {
        setPortfolio(p => ({ ...p, gttOrders: p.gttOrders.filter(g => g.id !== gttId) }));
    }, []);

    const processedGttIds = useRef(new Set());

    useEffect(() => {
        const activeGTTs = portfolio.gttOrders.filter(o => o.status === GTTStatus.ACTIVE);
        if (activeGTTs.length === 0 || marketData.length === 0) return;

        for (const gtt of activeGTTs) {
            if (processedGttIds.current.has(gtt.id)) continue;

            const stock = getStock(gtt.symbol);
            if (!stock) continue;

            let isTriggered = false;
            let executedPrice = 0;
            let orderType = gtt.transactionType;

            if (gtt.triggerType === GTTTriggerType.SINGLE) {
                 if (gtt.transactionType === TransactionType.BUY && stock.ltp >= gtt.triggerPrice!) {
                    isTriggered = true;
                    executedPrice = gtt.limitPrice!;
                } else if (gtt.transactionType === TransactionType.SELL && stock.ltp >= gtt.triggerPrice!) { // Corrected logic for sell GTT (target price)
                    isTriggered = true;
                    executedPrice = gtt.limitPrice!;
                }
            } else if (gtt.triggerType === GTTTriggerType.OCO) {
                if (stock.ltp <= gtt.stoplossTriggerPrice!) {
                    isTriggered = true;
                    executedPrice = gtt.stoplossLimitPrice!;
                    orderType = TransactionType.SELL;
                } else if (stock.ltp >= gtt.targetTriggerPrice!) {
                    isTriggered = true;
                    executedPrice = gtt.targetLimitPrice!;
                    orderType = TransactionType.SELL;
                }
            }
            
            if (isTriggered) {
                processedGttIds.current.add(gtt.id);
                const orderToExecute: Omit<Order, 'id' | 'timestamp' | 'status'> = {
                    symbol: gtt.symbol,
                    quantity: gtt.quantity,
                    price: executedPrice,
                    orderType: OrderType.LIMIT,
                    transactionType: orderType,
                };
                const success = executeTrade(orderToExecute);
                
                setPortfolio(p => ({
                    ...p,
                    gttOrders: p.gttOrders.map(o => 
                        o.id === gtt.id 
                        ? { ...o, status: success ? GTTStatus.TRIGGERED : GTTStatus.CANCELLED } 
                        : o
                    )
                }));
            }
        }
    }, [marketData, portfolio.gttOrders, getStock, executeTrade]);
    
    useEffect(() => {
        processedGttIds.current.clear();
    }, [portfolio.gttOrders]);

    // --- ALERT LOGIC ---
    const createAlert = useCallback((alertData: Omit<Alert, 'id' | 'createdAt' | 'expiresAt' | 'status'>) => {
        const newAlert: Alert = {
            ...alertData,
            id: `alert_${Date.now()}`,
            createdAt: Date.now(),
            expiresAt: Date.now() + 31536000000, // 1 year
            status: AlertStatus.ACTIVE,
        };
        setPortfolio(p => ({ ...p, alerts: [newAlert, ...p.alerts] }));
    }, []);

    const deleteAlert = useCallback((alertId: string) => {
        setPortfolio(p => ({ ...p, alerts: p.alerts.filter(a => a.id !== alertId) }));
    }, []);
    
    const processedAlertIds = useRef(new Set());

    useEffect(() => {
        const activeAlerts = portfolio.alerts.filter(a => a.status === AlertStatus.ACTIVE);
        if (activeAlerts.length === 0 || marketData.length === 0) return;

        for (const alert of activeAlerts) {
            if (processedAlertIds.current.has(alert.id)) continue;

            const stock = getStock(alert.symbol);
            if (!stock) continue;

            const currentValue = stock[alert.property as keyof Stock] as number;
            let conditionMet = false;
            
            switch (alert.operator) {
                case '>=': if (currentValue >= alert.value) conditionMet = true; break;
                case '>':  if (currentValue > alert.value) conditionMet = true; break;
                case '<=': if (currentValue <= alert.value) conditionMet = true; break;
                case '<':  if (currentValue < alert.value) conditionMet = true; break;
                case '==': if (currentValue == alert.value) conditionMet = true; break;
            }

            if (conditionMet) {
                processedAlertIds.current.add(alert.id);
                
                // Show notification
                window.alert(`🔔 Alert Triggered for ${alert.symbol}: ${alert.property} is now ${alert.operator} ${alert.value}. Current value: ${formatCurrency(currentValue)}`);

                // Mark as triggered
                setPortfolio(p => ({
                    ...p,
                    alerts: p.alerts.map(a => 
                        a.id === alert.id ? { ...a, status: AlertStatus.TRIGGERED } : a
                    )
                }));
                // Here you would execute ATO if type was ATO
            }
        }
    }, [marketData, portfolio.alerts, getStock]);

    useEffect(() => {
        processedAlertIds.current.clear();
    }, [portfolio.alerts]);

    return (
        <PortfolioContext.Provider value={{ portfolio, executeTrade, executeBracketOrder, createGTT, deleteGTT, createAlert, deleteAlert, getStock, marketData, loading, addInr, buyNfino, convertNfinoToVirtual, claimDailyBonus }}>
            {children}
        </PortfolioContext.Provider>
    );
};

export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
};