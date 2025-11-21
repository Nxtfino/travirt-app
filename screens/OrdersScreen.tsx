
import React, { useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { formatCurrency } from '../utils/formatters';
import { GTTOrder, GTTTriggerType, Alert } from '../types';

const GTTList: React.FC = () => {
    const { portfolio, deleteGTT } = usePortfolio();
    const activeGTTs = portfolio.gttOrders.filter(o => o.status === 'ACTIVE');

    const GTTType: React.FC<{ order: GTTOrder }> = ({ order }) => {
        const typeClass = order.transactionType === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger';
        return (
            <span className={`font-bold text-xs py-1 px-2 rounded ${typeClass}`}>
                {order.triggerType} - {order.transactionType}
            </span>
        );
    };
    
    const TriggerPrice: React.FC<{ order: GTTOrder }> = ({ order }) => {
        if (order.triggerType === GTTTriggerType.SINGLE) {
            return <>{formatCurrency(order.triggerPrice!)}</>;
        }
        return <>{formatCurrency(order.stoplossTriggerPrice!)} / {formatCurrency(order.targetTriggerPrice!)}</>;
    };

    return (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-secondary uppercase bg-overlay">
                        <tr>
                            <th scope="col" className="p-3">Created at</th>
                            <th scope="col" className="p-3">Instrument</th>
                            <th scope="col" className="p-3">Type</th>
                            <th scope="col" className="p-3">Trigger</th>
                            <th scope="col" className="p-3">Status</th>
                            <th scope="col" className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeGTTs.length > 0 ? (
                            activeGTTs.map(order => (
                                <tr key={order.id} className="border-b border-overlay last:border-b-0 hover:bg-overlay/50">
                                    <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3 font-semibold text-text-primary">{order.symbol}</td>
                                    <td className="p-3"><GTTType order={order} /></td>
                                    <td className="p-3 font-mono"><TriggerPrice order={order} /></td>
                                    <td className="p-3">
                                        <span className="font-bold text-xs py-0.5 px-1.5 rounded bg-blue-500/20 text-blue-400">
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                         <button onClick={() => { if(window.confirm('Are you sure you want to delete this GTT?')) deleteGTT(order.id) }} className="text-muted hover:text-danger text-lg px-2"><i className="fas fa-trash-alt"></i></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={6} className="text-center p-8 text-muted">
                                    You have no active GTTs.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AlertList: React.FC = () => {
    const { portfolio, deleteAlert } = usePortfolio();
    const activeAlerts = portfolio.alerts.filter(a => a.status === 'ACTIVE');
    
    const getPropertyLabel = (prop: string) => {
      return prop.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    return (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-secondary uppercase bg-overlay">
                        <tr>
                            <th scope="col" className="p-3">Created at</th>
                            <th scope="col" className="p-3">Instrument</th>
                            <th scope="col" className="p-3">Condition</th>
                            <th scope="col" className="p-3">Status</th>
                            <th scope="col" className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeAlerts.length > 0 ? (
                            activeAlerts.map(alert => (
                                <tr key={alert.id} className="border-b border-overlay last:border-b-0 hover:bg-overlay/50">
                                    <td className="p-3">{new Date(alert.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3 font-semibold text-text-primary">{alert.symbol}</td>
                                    <td className="p-3 font-mono">{`${getPropertyLabel(alert.property)} ${alert.operator} ${formatCurrency(alert.value)}`}</td>
                                    <td className="p-3">
                                        <span className="font-bold text-xs py-0.5 px-1.5 rounded bg-blue-500/20 text-blue-400">
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                         <button onClick={() => { if(window.confirm('Are you sure you want to delete this alert?')) deleteAlert(alert.id) }} className="text-muted hover:text-danger text-lg px-2"><i className="fas fa-trash-alt"></i></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={5} className="text-center p-8 text-muted">
                                    You have no active alerts.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const OrdersScreen: React.FC = () => {
    const { portfolio } = usePortfolio();
    const [activeTab, setActiveTab] = useState<'orders' | 'gtt' | 'alerts'>('orders');

    const TabButton: React.FC<{ tabName: 'orders' | 'gtt' | 'alerts', label: string }> = ({ tabName, label }) => (
         <button 
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === tabName ? 'bg-surface text-text-primary' : 'bg-transparent text-muted hover:bg-surface/50'}`}>
            {label}
        </button>
    );

    return (
        <main className="animate-fade-in p-6">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-text-primary">Orders</h2>
                
                <div className="border-b border-overlay">
                    <TabButton tabName="orders" label="Orders" />
                    <TabButton tabName="gtt" label={`GTT (${portfolio.gttOrders.filter(o => o.status === 'ACTIVE').length})`} />
                    <TabButton tabName="alerts" label={`Alerts (${portfolio.alerts.filter(a => a.status === 'ACTIVE').length})`} />
                </div>

                {activeTab === 'orders' && (
                    <div className="bg-surface rounded-lg shadow-lg">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-text-primary mb-4">Order History</h3>
                            {portfolio.orderHistory.length > 0 ? (
                                <ul className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                                    {portfolio.orderHistory.map(order => (
                                        <li key={order.id} className="grid grid-cols-3 items-center text-sm p-3 rounded-md bg-overlay gap-2">
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`font-bold text-xs py-0.5 px-1.5 rounded ${order.status === 'EXECUTED' ? 'bg-green-500/20 text-success' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                        {order.status}
                                                    </span>
                                                    <span className={`font-bold ${order.transactionType === 'BUY' ? 'text-success' : 'text-danger'}`}>
                                                        {order.transactionType}
                                                    </span>
                                                    <span className="font-semibold text-text-primary">{order.symbol}</span>
                                                </div>
                                                <div className="text-xs text-muted mt-1">
                                                    {order.quantity} shares @ {order.orderType.replace('_MARKET', '')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-text-primary">{formatCurrency(order.price!)}</p>
                                                <p className="text-xs text-muted">{new Date(order.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-10 text-muted">
                                    <i className="fas fa-file-alt text-4xl mb-4"></i>
                                    <h4 className="text-lg font-semibold text-text-primary">No Orders Yet</h4>
                                    <p>Your executed and pending orders will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'gtt' && <GTTList />}
                {activeTab === 'alerts' && <AlertList />}
            </div>
        </main>
    );
};

export default OrdersScreen;