
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Watchlist, WatchlistGroup, WatchlistSettings, Stock, DiscoverList } from '../types';

export type ActiveView = 
  | { type: 'watchlist'; id: number }
  | { type: 'discover'; list: DiscoverList };


interface WatchlistContextType {
    watchlists: Watchlist[];
    activeView: ActiveView;
    activeWatchlist: Watchlist | null;
    lastActiveStackView: ActiveView | null;
    loading: boolean;
    pinnedItems: string[];
    pinStock: (symbol: string, slot: number) => void;
    setActiveView: (view: ActiveView) => void;
    addWatchlist: (name: string) => void;
    removeWatchlist: (id: number) => void;
    updateWatchlistName: (id: number, name: string) => void;
    addStockToGroup: (watchlistId: number, groupId: string, symbol: string) => void;
    removeStockFromGroup: (watchlistId: number, groupId: string, symbol: string) => void;
    addWatchlistFromDiscover: (list: DiscoverList) => void;
    reorderStockInGroup: (watchlistId: number, groupId: string, startIndex: number, endIndex: number) => void;
    reorderGroups: (watchlistId: number, startIndex: number, endIndex: number) => void;
    toggleGroupCollapse: (watchlistId: number, groupId: string) => void;
    toggleGroupMaximize: (watchlistId: number, groupId: string) => void;
    updateGroup: (watchlistId: number, groupId: string, newName: string, newColor?: string) => void;
    addGroup: (watchlistId: number, groupName: string) => void;
    removeGroup: (watchlistId: number, groupId: string) => void;
    moveGroupToWatchlist: (watchlistId: number, groupId: string, targetWatchlistId: number) => void;
    updateGroupSymbols: (watchlistId: number, groupId: string, newSymbols: string[]) => void;
    updateWatchlistSettings: (watchlistId: number, newSettings: Partial<WatchlistSettings>) => void;
    sortAllAssetsInWatchlist: (watchlistId: number, sortBy: WatchlistSettings['sortBy'], marketData: Stock[]) => void;
    updateNote: (watchlistId: number, symbol: string, text: string) => void;
    deleteNote: (watchlistId: number, symbol: string) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

const defaultSettings: WatchlistSettings = {
  changeType: 'close',
  showOptions: {
    priceChange: true,
    priceChangePercent: true,
    priceDirection: true,
    holdings: false,
    notes: false,
    groupColors: true,
  },
  sortBy: 'LTP',
};


const initialWatchlistsData: Watchlist[] = [
  { id: 1, name: "1", groups: [{ id: 'default-1', name: 'Default', symbols: [], isCollapsed: false, isMaximized: false }], settings: defaultSettings, notes: {} },
  { id: 2, name: "2", groups: [{ id: 'default-2', name: 'Default', symbols: [], isCollapsed: false, isMaximized: false }], settings: defaultSettings, notes: {} },
  { id: 3, name: "3", groups: [{ id: 'default-3', name: 'Default', symbols: [], isCollapsed: false, isMaximized: false }], settings: defaultSettings, notes: {} },
  { id: 4, name: "4", groups: [{ id: 'default-4', name: 'Default', symbols: [], isCollapsed: false, isMaximized: false }], settings: defaultSettings, notes: {} },
  { id: 5, name: "5", groups: [{ id: 'default-5', name: 'Default', symbols: ["KOTAKBANK", "HDFCBANK", "BHARTIARTL", "EICHERMOT"], isCollapsed: false, isMaximized: false }], settings: defaultSettings, notes: {} },
  { 
    id: 6, 
    name: "6", 
    groups: [{ 
      id: 'default-6', 
      name: 'Default', 
      symbols: ["TATASTEEL", "TCS", "TECHM", "TITAN", "TORNTPOWER", "TORNTPHARM", "TVSMOTOR", "UBL", "UPL", "ULTRACEMCO", "VOLTAS", "WIPRO", "BHEL", "IDBI"],
      isCollapsed: false,
      isMaximized: false,
    }],
    settings: defaultSettings,
    notes: {}
  },
  { id: 7, name: "7", groups: [{ id: 'default-7', name: 'Default', symbols: [], isCollapsed: false, isMaximized: false }], settings: defaultSettings, notes: {} },
];


export const WatchlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [activeView, _setActiveView] = useState<ActiveView>({ type: 'watchlist', id: 6 });
    const [lastActiveStackView, setLastActiveStackView] = useState<ActiveView | null>(null);
    const [loading, setLoading] = useState(true);
    const [pinnedItems, setPinnedItems] = useState<string[]>(['NIFTY 50', 'SENSEX', 'NIFTY BANK']);

    useEffect(() => {
        // Simulate loading from localStorage or an API
        setWatchlists(initialWatchlistsData);
        setLoading(false);
    }, []);

    useEffect(() => {
        // Set the last active stack view to the first available "other" list
        // This ensures the stack tab has a target even on initial load
        const firstOtherList = watchlists.find(w => w.id > 7);
        if (firstOtherList && !lastActiveStackView) {
            setLastActiveStackView({ type: 'watchlist', id: firstOtherList.id });
        }
    }, [watchlists, lastActiveStackView]);

    const setActiveView = useCallback((view: ActiveView) => {
        _setActiveView(view);
        if ((view.type === 'watchlist' && view.id > 7) || view.type === 'discover') {
            setLastActiveStackView(view);
        }
    }, []);


    const pinStock = useCallback((symbol: string, slot: number) => {
        if (slot < 1 || slot > 3) return;
        setPinnedItems(prev => {
            const newPinned = [...prev];
            newPinned[slot - 1] = symbol;
            return newPinned;
        });
    }, []);

    const addWatchlist = useCallback((name: string) => {
        setWatchlists(prev => {
            const nextId = prev.length > 0 ? Math.max(...prev.map(w => w.id)) + 1 : 1;
            const newWatchlist: Watchlist = {
                id: nextId,
                name: name || `Watchlist ${nextId}`,
                groups: [{ id: `default-${nextId}`, name: 'Default', symbols: [], isCollapsed: false, isMaximized: false, color: undefined }],
                settings: defaultSettings,
                notes: {},
            };
            const newWatchlists = [...prev, newWatchlist];
            setActiveView({ type: 'watchlist', id: nextId });
            return newWatchlists;
        });
    }, [setActiveView]);
    
    const addGroup = useCallback((watchlistId: number, groupName: string) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                const newGroupId = `group-${w.id}-${Date.now()}`;
                const newGroup: WatchlistGroup = {
                    id: newGroupId,
                    name: groupName,
                    symbols: [],
                    isCollapsed: false,
                    isMaximized: false,
                    color: undefined,
                };
                return { ...w, groups: [...w.groups, newGroup] };
            }
            return w;
        }));
    }, []);

    const addWatchlistFromDiscover = useCallback((list: DiscoverList) => {
        setWatchlists(prev => {
            const nextId = prev.length > 0 ? Math.max(...prev.map(w => w.id)) + 1 : 1;
            const newWatchlist: Watchlist = {
                id: nextId,
                name: list.name,
                groups: [{ id: `default-${nextId}`, name: 'Default', symbols: list.symbols, isCollapsed: false, isMaximized: false }],
                settings: defaultSettings,
                notes: {},
            };
            const newWatchlists = [...prev, newWatchlist];
            setActiveView({ type: 'watchlist', id: nextId });
            return newWatchlists;
        });
    }, [setActiveView]);

    const removeWatchlist = useCallback((id: number) => {
        setWatchlists(prev => {
            const newWatchlists = prev.filter(w => w.id !== id)
            if (activeView.type === 'watchlist' && activeView.id === id) {
                const firstWatchlist = newWatchlists.find(w => w.id <= 7) || newWatchlists[0];
                setActiveView({ type: 'watchlist', id: firstWatchlist ? firstWatchlist.id : 1 });
            }
            return newWatchlists;
        });
    }, [activeView, setActiveView]);

    const updateWatchlistName = useCallback((id: number, name: string) => {
        setWatchlists(prev => prev.map(w => (w.id === id ? { ...w, name } : w)));
    }, []);

    const addStockToGroup = useCallback((watchlistId: number, groupId: string, symbol: string) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                return {
                    ...w,
                    groups: w.groups.map(g => {
                        if (g.id === groupId && !g.symbols.includes(symbol)) {
                            return { ...g, symbols: [...g.symbols, symbol] };
                        }
                        return g;
                    })
                };
            }
            return w;
        }));
    }, []);
    
    const removeStockFromGroup = useCallback((watchlistId: number, groupId: string, symbol: string) => {
         setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                return {
                    ...w,
                    groups: w.groups.map(g => {
                        if (g.id === groupId) {
                            return { ...g, symbols: g.symbols.filter(s => s !== symbol) };
                        }
                        return g;
                    })
                };
            }
            return w;
        }));
    }, []);

    const reorderStockInGroup = useCallback((watchlistId: number, groupId: string, startIndex: number, endIndex: number) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                const newGroups = w.groups.map(g => {
                    if (g.id === groupId) {
                        const newSymbols = Array.from(g.symbols);
                        const [removed] = newSymbols.splice(startIndex, 1);
                        newSymbols.splice(endIndex, 0, removed);
                        return { ...g, symbols: newSymbols };
                    }
                    return g;
                });
                return { ...w, groups: newGroups };
            }
            return w;
        }));
    }, []);

    const reorderGroups = useCallback((watchlistId: number, startIndex: number, endIndex: number) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                const newGroups = Array.from(w.groups);
                const [removed] = newGroups.splice(startIndex, 1);
                newGroups.splice(endIndex, 0, removed);
                return { ...w, groups: newGroups };
            }
            return w;
        }));
    }, []);

    const toggleGroupCollapse = useCallback((watchlistId: number, groupId: string) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                return {
                    ...w,
                    groups: w.groups.map(g => g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g)
                };
            }
            return w;
        }));
    }, []);

    const toggleGroupMaximize = useCallback((watchlistId: number, groupId: string) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                return {
                    ...w,
                    groups: w.groups.map(g => g.id === groupId ? { ...g, isMaximized: !g.isMaximized } : g)
                };
            }
            return w;
        }));
    }, []);
    
    const updateGroup = useCallback((watchlistId: number, groupId: string, newName: string, newColor?: string) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                return {
                    ...w,
                    groups: w.groups.map(g => {
                        if (g.id === groupId) {
                            return { ...g, name: newName, color: newColor };
                        }
                        return g;
                    })
                };
            }
            return w;
        }));
    }, []);

    const removeGroup = useCallback((watchlistId: number, groupId: string) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                return { ...w, groups: w.groups.filter(g => g.id !== groupId) };
            }
            return w;
        }));
    }, []);

    const moveGroupToWatchlist = useCallback((watchlistId: number, groupId: string, targetWatchlistId: number) => {
        setWatchlists(prev => {
            const currentWatchlist = prev.find(w => w.id === watchlistId);
            const groupToMove = currentWatchlist?.groups.find(g => g.id === groupId);

            if (!groupToMove) return prev;

            return prev.map(w => {
                // Remove from source
                if (w.id === watchlistId) {
                    return { ...w, groups: w.groups.filter(g => g.id !== groupId) };
                }
                // Add to destination at the end
                if (w.id === targetWatchlistId) {
                    return { ...w, groups: [...w.groups, groupToMove] };
                }
                return w;
            });
        });
    }, []);

    const updateGroupSymbols = useCallback((watchlistId: number, groupId: string, newSymbols: string[]) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                return {
                    ...w,
                    groups: w.groups.map(g => {
                        if (g.id === groupId) {
                            return { ...g, symbols: newSymbols };
                        }
                        return g;
                    })
                };
            }
            return w;
        }));
    }, []);

    const updateWatchlistSettings = useCallback((watchlistId: number, newSettings: Partial<WatchlistSettings>) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                return {
                    ...w,
                    settings: { ...w.settings, ...newSettings }
                };
            }
            return w;
        }));
    }, []);

    const sortAllAssetsInWatchlist = useCallback((watchlistId: number, sortBy: WatchlistSettings['sortBy'], marketData: Stock[]) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id !== watchlistId) return w;

            const symbolToGroupMap = new Map<string, string>();
            w.groups.forEach(g => {
                g.symbols.forEach(s => symbolToGroupMap.set(s, g.id));
            });

            const allSymbols = Array.from(symbolToGroupMap.keys());
            const allStocks = allSymbols.map(s => marketData.find(md => md.symbol === s)).filter((s): s is Stock => !!s);
            
            allStocks.sort((a, b) => {
                const aRefPrice = w.settings.changeType === 'open' ? a.open : a.prevClose;
                const bRefPrice = w.settings.changeType === 'open' ? b.open : b.prevClose;
                const aChangePercent = (a.ltp - aRefPrice) / aRefPrice;
                const bChangePercent = (b.ltp - bRefPrice) / bRefPrice;

                switch (sortBy) {
                    case '%': return bChangePercent - aChangePercent;
                    case 'LTP': return b.ltp - a.ltp;
                    case 'A-Z': return a.symbol.localeCompare(b.symbol);
                    case 'EXCH': return a.exchange.localeCompare(b.exchange);
                    default: return 0;
                }
            });
            
            const sortedSymbols = allStocks.map(s => s.symbol);
            
            // FIX: Explicitly type the Map and create it directly to avoid type inference issues.
            const groupMap = new Map<string, WatchlistGroup>(
                w.groups.map(g => [g.id, { ...g, symbols: [] }])
            );

            sortedSymbols.forEach(symbol => {
                const groupId = symbolToGroupMap.get(symbol);
                if (groupId) {
                    groupMap.get(groupId)?.symbols.push(symbol);
                }
            });

            return { ...w, groups: Array.from(groupMap.values()) };
        }));
    }, []);

    const updateNote = useCallback((watchlistId: number, symbol: string, text: string) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                const newNotes = { ...w.notes, [symbol]: text };
                return { ...w, notes: newNotes };
            }
            return w;
        }));
    }, []);

    const deleteNote = useCallback((watchlistId: number, symbol: string) => {
        setWatchlists(prev => prev.map(w => {
            if (w.id === watchlistId) {
                const newNotes = { ...w.notes };
                delete newNotes[symbol];
                return { ...w, notes: newNotes };
            }
            return w;
        }));
    }, []);


    const activeWatchlist = useMemo(() => {
        if (activeView.type === 'watchlist') {
            return watchlists.find(w => w.id === activeView.id) || null;
        }
        return null;
    }, [activeView, watchlists]);

    const value = {
        watchlists,
        activeView,
        activeWatchlist,
        lastActiveStackView,
        loading,
        pinnedItems,
        pinStock,
        setActiveView,
        addWatchlist,
        removeWatchlist,
        updateWatchlistName,
        addStockToGroup,
        removeStockFromGroup,
        addWatchlistFromDiscover,
        reorderStockInGroup,
        reorderGroups,
        toggleGroupCollapse,
        toggleGroupMaximize,
        updateGroup,
        addGroup,
        removeGroup,
        moveGroupToWatchlist,
        updateGroupSymbols,
        updateWatchlistSettings,
        sortAllAssetsInWatchlist,
        updateNote,
        deleteNote,
    };

    return (
        <WatchlistContext.Provider value={value}>
            {children}
        </WatchlistContext.Provider>
    );
};

export const useWatchlist = () => {
    const context = useContext(WatchlistContext);
    if (context === undefined) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }
    return context;
};