
import React, { useState } from 'react';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import DashboardScreen from './screens/DashboardScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import TradeScreen from './screens/TradeScreen';
import WebAuthScreen from './screens/auth/WebAuthScreen';
import BidsScreen from './screens/BidsScreen';
import OrdersScreen from './screens/OrdersScreen';
import PositionsScreen from './screens/PositionsScreen';
import FundsScreen from './screens/FundsScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import AINewsScreen from './screens/AINewsScreen';
import WebHeader from './components/layout/WebHeader';

export type Screen = 'dashboard' | 'trade' | 'portfolio' | 'orders' | 'positions' | 'earn-tokens' | 'funds' | 'leaderboard' | 'ai-news';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>('TRDR001'); // Default login for demo
    const [activeScreen, setActiveScreen] = useState<Screen>('trade');
    const [showRefillPrompt, setShowRefillPrompt] = useState(false);
    const isAuthenticated = !!currentUser;

    const handleLogout = () => {
        setCurrentUser(null);
        setActiveScreen('dashboard');
    };

    const handleRefill = () => {
        setShowRefillPrompt(false);
        setActiveScreen('funds');
    };

    const RefillPrompt = () => (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-surface rounded-lg shadow-2xl p-8 w-full max-w-md text-center">
                <i className="fas fa-wallet text-4xl text-primary mb-4"></i>
                <h3 className="text-2xl font-bold mb-2">Insufficient Balance</h3>
                <p className="text-muted mb-6">You don't have enough virtual balance to complete this transaction. Please add funds to continue trading.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => setShowRefillPrompt(false)} className="px-6 py-2 rounded-md bg-overlay hover:bg-base text-text-primary font-semibold transition">Cancel</button>
                    <button onClick={handleRefill} className="px-6 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition">Go to Funds</button>
                </div>
            </div>
        </div>
    );

    const renderScreen = () => {
        switch (activeScreen) {
            case 'trade':
                return <TradeScreen />;
            case 'portfolio':
                return <PortfolioScreen />;
            case 'orders':
                return <OrdersScreen />;
            case 'positions':
                return <PositionsScreen />;
            case 'earn-tokens':
                return <BidsScreen />;
            case 'funds':
                return <FundsScreen />;
            case 'leaderboard':
                return <LeaderboardScreen />;
            case 'ai-news':
                return <AINewsScreen />;
            case 'dashboard':
            default:
                return <DashboardScreen setActiveScreen={setActiveScreen} />;
        }
    };

    if (!isAuthenticated) {
        return <WebAuthScreen onLoginSuccess={(userId) => setCurrentUser(userId)} />;
    }

    return (
        <PortfolioProvider setShowRefillPrompt={setShowRefillPrompt}>
            <WatchlistProvider>
                <div className="flex flex-col h-screen bg-base text-text-primary font-sans">
                    <WebHeader 
                        activeScreen={activeScreen} 
                        setActiveScreen={setActiveScreen} 
                        username={currentUser!} 
                        onLogout={handleLogout}
                    />
                    <div className={`flex-1 ${activeScreen === 'trade' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                       {renderScreen()}
                    </div>
                    {showRefillPrompt && <RefillPrompt />}
                </div>
            </WatchlistProvider>
        </PortfolioProvider>
    );
};

export default App;