
import React from 'react';
import { formatPercent } from '../utils/formatters';

// Mock data for leaderboard
const leaderboardData = [
    { rank: 1, name: 'Trader_Ace', returns: 45.78, avatar: 'https://i.pravatar.cc/150?u=trader_ace' },
    { rank: 2, name: 'MarketMaverick', returns: 39.12, avatar: 'https://i.pravatar.cc/150?u=marketmaverick' },
    { rank: 3, name: 'CryptoKing', returns: 35.45, avatar: 'https://i.pravatar.cc/150?u=cryptoking' },
    { rank: 4, name: 'StockSensei', returns: 28.99, avatar: 'https://i.pravatar.cc/150?u=stocksensei' },
    { rank: 5, name: 'ProfitPro', returns: 25.67, avatar: 'https://i.pravatar.cc/150?u=profitpro' },
    { rank: 6, name: 'You', returns: 12.34, avatar: 'https://i.pravatar.cc/150?u=you' },
    { rank: 7, name: 'BetaTester', returns: 9.87, avatar: 'https://i.pravatar.cc/150?u=betatester' },
    { rank: 8, name: 'NewbieTrader', returns: -2.5, avatar: 'https://i.pravatar.cc/150?u=newbietrader' },
].sort((a, b) => b.returns - a.returns).map((user, index) => ({...user, rank: index + 1}));


const LeaderboardScreen: React.FC = () => {

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-yellow-500 text-yellow-900';
        if (rank === 2) return 'bg-gray-400 text-gray-900';
        if (rank === 3) return 'bg-yellow-700 text-yellow-100';
        return 'bg-overlay text-text-primary';
    }

    return (
        <main className="p-6">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-text-primary">Leaderboard</h2>
                <p className="text-muted">Top performers across the platform based on monthly returns.</p>
                
                <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-text-secondary">
                            <thead className="text-xs text-text-secondary uppercase bg-overlay">
                                <tr>
                                    <th scope="col" className="p-4 text-center">Rank</th>
                                    <th scope="col" className="p-4">Trader</th>
                                    <th scope="col" className="p-4 text-right">Returns</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardData.map(user => (
                                    <tr key={user.rank} className={`border-b border-overlay transition-colors ${user.name === 'You' ? 'bg-primary/20' : 'hover:bg-overlay'}`}>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block w-8 h-8 leading-8 rounded-full font-bold text-center ${getRankColor(user.rank)}`}>
                                                {user.rank}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-text-primary">
                                            <div className="flex items-center">
                                                <img className="w-10 h-10 rounded-full mr-4" src={user.avatar} alt={user.name} />
                                                <span>{user.name}</span>
                                            </div>
                                        </td>
                                        <td className={`p-4 text-right font-bold text-lg ${user.returns >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {formatPercent(user.returns / 100)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LeaderboardScreen;