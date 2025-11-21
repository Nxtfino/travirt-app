
import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../../App';
import Logo from '../auth/Logo';
import ProfileDropdown from './ProfileDropdown';
import { useIndexData } from '../../hooks/useIndexData';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface WebHeaderProps {
    activeScreen: Screen;
    setActiveScreen: (screen: Screen) => void;
    username: string;
    onLogout: () => void;
}

const symbolMapping: { [displayName: string]: string } = {
    'NIFTY 50': '^NSEI',
    'SENSEX': '^BSESN',
    'NIFTY BANK': 'NIFTY BANK',
};


const WebHeader: React.FC<WebHeaderProps> = ({ activeScreen, setActiveScreen, username, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const { pinnedItems } = useWatchlist();
    const { marketData, loading: marketLoading } = usePortfolio();

    const pinnedIndexSymbols = pinnedItems.map(item => symbolMapping[item]).filter(Boolean);
    const { data: indexData, loading: indexLoading } = useIndexData(pinnedIndexSymbols);
    
    const navItems = ['Dashboard', 'Trade', 'Portfolio', 'Leaderboard', 'AI News', 'Orders', 'Positions', 'Funds', 'Earn Tokens'];

    const getInitials = (id: string) => {
        const matches = id.match(/[a-zA-Z]/g) || [];
        if (matches.length >= 2) {
            return (matches[0] + matches[matches.length - 1]).toUpperCase();
        }
        return id.substring(0, 2).toUpperCase();
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toScreenKey = (item: string) => item.toLowerCase().replace(' ', '-') as Screen;

    return (
        <header className="bg-surface border-b border-overlay h-16 flex items-center justify-between text-sm text-text-primary sticky top-0 z-30">
            {/* Left Section: Pinned Items */}
            <div className="flex items-center gap-4 text-xs pl-4 h-full">
               {pinnedItems.map((item, index) => {
                   if (!item) {
                       return <div key={index} className="w-48 h-8 bg-overlay/50 rounded animate-pulse" />;
                   }

                   const stock = !marketLoading ? marketData.find(s => s.symbol === item) : null;
                   const apiSymbol = symbolMapping[item];
                   const indexQuote = !indexLoading ? indexData[apiSymbol] : null;

                   if (marketLoading || indexLoading) {
                       return (
                           <div key={item} className="flex items-baseline gap-2">
                               <span className="font-semibold text-muted">{item}</span>
                               <span className="font-mono text-muted">--</span>
                           </div>
                       );
                   }

                   if (stock) {
                       const isUp = stock.change >= 0;
                       const colorClass = isUp ? 'text-success' : 'text-danger';
                       return (
                           <div key={item} className="flex items-baseline gap-2">
                               <span className="font-semibold text-text-secondary">{stock.symbol}</span>
                               <span className={`font-mono font-semibold ${colorClass}`}>{stock.ltp.toFixed(2)}</span>
                               <span className={`font-mono text-xs ${colorClass}`}>{isUp ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)</span>
                           </div>
                       );
                   }

                   if (indexQuote && indexQuote.d !== null && indexQuote.dp !== null) {
                       const isUp = indexQuote.d >= 0;
                       const colorClass = isUp ? 'text-success' : 'text-danger';
                       return (
                           <div key={item} className="flex items-baseline gap-2">
                               <span className="font-semibold text-text-secondary">{item}</span>
                               <span className={`font-mono font-semibold ${colorClass}`}>{indexQuote.c.toFixed(2)}</span>
                               <span className={`font-mono text-xs ${colorClass}`}>{isUp ? '+' : ''}{indexQuote.d.toFixed(2)} ({indexQuote.dp.toFixed(2)}%)</span>
                           </div>
                       );
                   }
                   
                   return (
                       <div key={item} className="flex items-baseline gap-2">
                            <span className="font-semibold text-muted">{item}</span>
                            <span className="font-mono text-muted">--</span>
                        </div>
                   );
               })}
            </div>

            {/* Right Section */}
            <div className="flex items-center h-full">
                <div className="border-l border-overlay h-full flex items-center px-4">
                    <Logo />
                </div>
                
                <nav className="flex items-center gap-6 h-full">
                    {navItems.map(item => {
                        const screenKey = toScreenKey(item);
                        const isDashboard = screenKey === 'dashboard';
                        return (
                            <button
                                key={item}
                                onClick={() => setActiveScreen(screenKey)}
                                className={`font-medium h-full flex items-start justify-center text-center pt-5 max-w-24 border-b-2 transition-colors duration-200 ${
                                    activeScreen === screenKey
                                        ? (isDashboard ? 'text-orange-500 border-orange-500' : 'text-text-primary border-primary')
                                        : 'text-muted hover:text-text-primary border-transparent'
                                }`}
                            >
                                {item}
                            </button>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4 pl-6 pr-4">
                    <div className="w-px bg-overlay h-6"></div>
                    
                    <button className="text-muted hover:text-text-primary text-xl">
                        <i className="fas fa-shopping-basket"></i>
                    </button>
                     <button className="text-muted hover:text-text-primary text-xl">
                        <i className="fas fa-bell"></i>
                    </button>

                    <div ref={dropdownRef} className="relative">
                        <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 cursor-pointer group">
                            <div className="w-8 h-8 bg-overlay text-primary rounded-full flex items-center justify-center font-bold text-xs">
                                {getInitials(username)}
                            </div>
                            <span className="text-xs text-text-secondary">{username}</span>
                        </div>
                        {isDropdownOpen && <ProfileDropdown username={username} onLogout={onLogout} />}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default WebHeader;