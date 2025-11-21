
import React from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Screen } from '../App';
import { MOCK_INDICES } from '../constants';

const StatCard: React.FC<{ title: string; value: string; change?: string; changeColor?: string; icon: string; iconBg: string; }> = ({ title, value, change, changeColor, icon, iconBg }) => (
    <div className="bg-surface rounded-lg shadow-lg p-5 flex items-center">
        <div className={`rounded-full p-3 mr-4 ${iconBg}`}>
            <i className={`fas ${icon} text-white text-xl`}></i>
        </div>
        <div>
            <p className="text-sm text-muted font-medium">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            {change && <p className={`text-sm font-medium ${changeColor}`}>{change}</p>}
        </div>
    </div>
);

const IndexCard: React.FC<{ asset: typeof MOCK_INDICES[0] }> = ({ asset }) => (
    <div className="bg-surface rounded-lg p-4 flex items-center justify-between">
        <div>
            <p className="font-bold text-text-primary">{asset.symbol}</p>
            <p className={`text-lg font-semibold ${asset.change >= 0 ? 'text-success' : 'text-danger'}`}>
                {asset.ltp.toFixed(2)}
            </p>
             <p className={`text-xs ${asset.change >= 0 ? 'text-success' : 'text-danger'}`}>
                {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)} ({asset.changePercent.toFixed(2)}%)
            </p>
        </div>
        <div className="w-24 h-12">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={asset.history}>
                     <defs>
                        <linearGradient id={`color${asset.symbol.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={asset.change >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={asset.change >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={asset.change >= 0 ? '#10B981' : '#EF4444'} fill={`url(#color${asset.symbol.replace(/\s/g, '')})`} strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);


const DashboardScreen: React.FC<{ setActiveScreen: (screen: Screen) => void; }> = ({ setActiveScreen }) => {
    const { portfolio, marketData, loading } = usePortfolio();

    const portfolioValue = portfolio.virtualBalance + portfolio.totalCurrentValue;

    const topMovers = [...marketData]
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 5);

    return (
        <main className="animate-fade-in p-6">
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Portfolio Value" value={formatCurrency(portfolioValue)} icon="fa-wallet" iconBg="bg-blue-500" />
                    <StatCard title="Today's P&L" value={formatCurrency(portfolio.todayPnl)} change={`${portfolio.todayPnl >= 0 ? '▲' : '▼'} ${formatPercent(portfolio.totalInvested > 0 ? portfolio.todayPnl / portfolio.totalInvested : 0)}`} changeColor={portfolio.todayPnl >= 0 ? 'text-success' : 'text-danger'} icon="fa-chart-line" iconBg="bg-purple-500" />
                    <StatCard title="NFINO Tokens (NXO)" value={portfolio.nxoBalance.toLocaleString()} icon="fa-coins" iconBg="bg-yellow-500" />
                    <StatCard title="Virtual Balance" value={formatCurrency(portfolio.virtualBalance)} icon="fa-money-bill-wave" iconBg="bg-green-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content: Positions & Movers */}
                    <div className="lg:col-span-2 space-y-6">
                         {/* Indices */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {MOCK_INDICES.map(index => <IndexCard key={index.symbol} asset={index} />)}
                        </div>
                        {/* Your Holdings */}
                        <div className="bg-surface rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">My Holdings ({portfolio.positions.length})</h3>
                            {portfolio.positions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-left text-muted">
                                            <tr>
                                                <th className="py-2">Instrument</th>
                                                <th className="py-2 text-right">Qty.</th>
                                                <th className="py-2 text-right">Avg. price</th>
                                                <th className="py-2 text-right">LTP</th>
                                                <th className="py-2 text-right">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {portfolio.positions.slice(0, 5).map(pos => (
                                                <tr key={pos.symbol} className="border-b border-overlay last:border-b-0">
                                                    <td className="py-3 font-bold">{pos.symbol}</td>
                                                    <td className="py-3 text-right">{pos.quantity}</td>
                                                    <td className="py-3 text-right">{formatCurrency(pos.avgPrice)}</td>
                                                    <td className="py-3 text-right">{formatCurrency(pos.ltp)}</td>
                                                    <td className={`py-3 text-right font-bold ${pos.pnl >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(pos.pnl)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted">
                                    <i className="fas fa-folder-open text-4xl mb-3"></i>
                                    <p>You have no open positions.</p>
                                    <button onClick={() => setActiveScreen('trade')} className="mt-4 text-primary font-semibold hover:underline">Start Trading →</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Market Movers */}
                    <div className="bg-surface rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">Top Movers</h3>
                        {loading ? <p className="text-center text-muted">Loading...</p> : (
                            <ul className="space-y-4">
                                {topMovers.map(stock => (
                                    <li key={stock.symbol} className="flex justify-between items-center cursor-pointer" onClick={() => setActiveScreen('trade')}>
                                        <div>
                                            <p className="font-bold">{stock.symbol}</p>
                                            <p className="text-xs text-muted">{stock.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(stock.ltp)}</p>
                                            <p className={`text-sm font-bold ${stock.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({formatPercent(stock.changePercent / 100)})
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default DashboardScreen;