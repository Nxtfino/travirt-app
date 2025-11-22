import React, {
    useState,
    useMemo,
    useRef,
    useId,
    useEffect,
    useLayoutEffect
} from 'react';
import {
    createPortal
} from 'react-dom';
import {
    Stock,
    WatchlistGroup,
    TransactionType,
    OrderType,
    WatchlistSettings,
    SortByType,
    Watchlist
} from '../../types';
import {
    formatCurrency,
    formatPercent
} from '../../utils/formatters';
import {
    useWatchlist
} from '../../contexts/WatchlistContext';
import {
    usePortfolio
} from '../../contexts/PortfolioContext';
import {
    MoreOptionsMenu
} from './MoreOptionsMenu';


interface WatchlistPanelProps {
    activeList: Watchlist;
    isDiscover: boolean;
    selectedStock: Stock | null;
    onStockSelect: (stock: Stock) => void;
    onOrderAction: (action: {
        stock: Stock,
        type: TransactionType,
        price ? : number,
        orderType ? : OrderType
    }) => void;
    onCreateGTT: (symbol: string) => void;
    onCreateAlert: (symbol: string) => void;
    onShowMarketDepthModal: (symbol: string) => void;
}

const Tooltip: React.FC < {
    children: React.ReactNode;title: string;shortcut ? : string
} > = ({
    children,
    title,
    shortcut
}) => {
    const tooltipId = useId();
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [style, setStyle] = useState < React.CSSProperties > ({
        opacity: 0,
        pointerEvents: 'none',
    });

    const triggerRef = useRef < HTMLDivElement > (null);
    const tooltipRef = useRef < HTMLDivElement > (null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const showTooltip = () => setVisible(true);
    const hideTooltip = () => setVisible(false);

    useLayoutEffect(() => {
        if (visible && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipNode = tooltipRef.current;
            const tooltipRect = tooltipNode.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const PADDING = 8;

            const top = triggerRect.top - PADDING;
            let left = triggerRect.left + triggerRect.width / 2;
            let transform = 'translateX(-50%) translateY(-100%)';
            let arrowLeft = '50%';

            // Check left edge
            if ((left - tooltipRect.width / 2) < PADDING) {
                left = PADDING;
                transform = 'translateX(0) translateY(-100%)';
                arrowLeft = `${triggerRect.left + triggerRect.width / 2 - PADDING}px`;
            }
            // Check right edge
            else if ((left + tooltipRect.width / 2) > (viewportWidth - PADDING)) {
                left = viewportWidth - PADDING;
                transform = 'translateX(-100%) translateY(-100%)';
                const tooltipLeftEdge = viewportWidth - PADDING - tooltipRect.width;
                arrowLeft = `${triggerRect.left + triggerRect.width / 2 - tooltipLeftEdge}px`;
            }

            setStyle({
                    position: 'fixed',
                    top: `${top}px`,
                    left: `${left}px`,
                    transform,
                    zIndex: 9999,
                    '--arrow-left': arrowLeft,
                }
                as React.CSSProperties);
        } else {
            setStyle({
                opacity: 0,
                pointerEvents: 'none'
            });
        }
    }, [visible]);

    return ( <
            >
            <
            div ref = {
                triggerRef
            }
            className = "inline-block"
            onMouseEnter = {
                showTooltip
            }
            onMouseLeave = {
                hideTooltip
            }
            onFocus = {
                showTooltip
            }
            onBlur = {
                hideTooltip
            }
            aria - describedby = {
                tooltipId
            } > {
                children
            } <
            /div> {
            mounted && createPortal( <
                div ref = {
                    tooltipRef
                }
                id = {
                    tooltipId
                }
                role = "tooltip"
                className = "fixed px-3 py-2 bg-overlay text-text-primary text-xs rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200"
                style = {
                    {
                        ...style,
                        opacity: visible ? 1 : 0
                    }
                } >
                <
                div className = "font-bold text-sm" > {
                    title
                } < /div> {
                shortcut && < div className = "text-xs text-muted mt-0.5" > {
                    shortcut
                } < /div>} <
                div className = "absolute top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-overlay"
                style = {
                    {
                        left: 'var(--arrow-left, 50%)',
                        transform: 'translateX(-50%)'
                    }
                } >
                <
                /div> < /
                div > ,
                document.body
            )
        } <
        />
);
};

const NotesEditor: React.FC < {
    watchlistId: number;
    stockSymbol: string;
    onClose: () => void;
} > = ({
    watchlistId,
    stockSymbol,
    onClose
}) => {
    const {
        watchlists,
        updateNote,
        deleteNote
    } = useWatchlist();
    const watchlist = watchlists.find(w => w.id === watchlistId);
    const initialNote = watchlist?.notes?.[stockSymbol] || '';

    const [note, setNote] = useState(initialNote);
    const textareaRef = useRef < HTMLTextAreaElement > (null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [note]);

    const handleSave = () => {
        if (note.trim()) {
            updateNote(watchlistId, stockSymbol, note);
        } else {
            deleteNote(watchlistId, stockSymbol);
        }
        onClose();
    };

    const handleDelete = () => {
        deleteNote(watchlistId, stockSymbol);
        onClose();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.ctrlKey && e.key === 'Enter') {
                handleSave();
            }
        };

        const textarea = textareaRef.current;
        textarea?.addEventListener('keydown', handleKeyDown);

        return () => {
            textarea?.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, handleSave]);


    return ( <
        div className = "bg-base p-2.5 rounded-b-lg border-t border-overlay animate-fade-in"
        onClick = {
            e => e.stopPropagation()
        } >
        <
        textarea ref = {
            textareaRef
        }
        value = {
            note
        }
        onChange = {
            (e) => setNote(e.target.value)
        }
        placeholder = "Type your notes here..."
        className = "w-full bg-transparent text-text-secondary text-sm resize-y overflow-hidden block min-h-[60px] p-1 focus:outline-none"
        autoFocus /
        >
        <
        div className = "flex justify-end items-center gap-2 mt-2" >
        <
        Tooltip title = "Save"
        shortcut = "Ctrl+Enter" >
        <
        button onClick = {
            handleSave
        }
        className = "text-muted hover:text-success text-lg w-7 h-7 flex items-center justify-center rounded-full hover:bg-overlay" >
        <
        i className = "fas fa-check" > < /i> < /
        button > <
        /Tooltip> <
        Tooltip title = "Delete" >
        <
        button onClick = {
            handleDelete
        }
        className = "text-muted hover:text-danger text-lg w-7 h-7 flex items-center justify-center rounded-full hover:bg-overlay" >
        <
        i className = "fas fa-trash" > < /i> < /
        button > <
        /Tooltip> <
        Tooltip title = "Close"
        shortcut = "Esc" >
        <
        button onClick = {
            onClose
        }
        className = "text-muted hover:text-text-primary text-lg w-7 h-7 flex items-center justify-center rounded-full hover:bg-overlay" >
        <
        i className = "fas fa-times" > < /i> < /
        button > <
        /Tooltip> < /
        div > <
        /div>
    );
};


const PriceRangeIndicator: React.FC < {
    low: number;
    high: number;
    open: number;
    ltp: number;
    onPriceClick: (price: number) => void;
} > = ({
    low,
    high,
    open,
    ltp,
    onPriceClick
}) => {
    const range = high > low ? high - low : 1;
    const ltpPercent = Math.max(0, Math.min(100, ((ltp - low) / range) * 100));
    const openPercent = Math.max(0, Math.min(100, ((open - low) / range) * 100));

    return ( <
            div className = "relative h-8 my-2 pt-4 px-12" >
            <
            div className = "relative h-1 bg-overlay rounded-full" > {
                /* Open Price Marker */
            } <
            Tooltip title = {
                `Open: ${formatCurrency(open)}`
            } >
            <
            div className = "absolute top-1/2 w-2 h-2 bg-muted rounded-full cursor-pointer -translate-y-1/2"
            style = {
                {
                    left: `${openPercent}%`
                }
            }
            onClick = {
                (e) => {
                    e.stopPropagation();
                    onPriceClick(open);
                }
            } >
            <
            /div> < /
            Tooltip >

            {
                /* LTP Marker */
            } <
            Tooltip title = {
                `LTP: ${formatCurrency(ltp)}`
            } >
            <
            div className = "absolute top-1/2 w-3 h-3 bg-primary border-2 border-surface rounded-full cursor-pointer shadow-glow-blue z-10 -translate-y-1/2"
            style = {
                {
                    left: `${ltpPercent}%`
                }
            }
            onClick = {
                (e) => {
                    e.stopPropagation();
                    onPriceClick(ltp);
                }
            } >
            <
            /div> < /
            Tooltip > <
            /div> {
            /* Low Price Label */
        } <
        Tooltip title = {
            `Low: ${formatCurrency(low)}`
        } >
        <
        div className = "absolute left-0 top-1/2 text-xs text-muted cursor-pointer"
    onClick = {
            (e) => {
                e.stopPropagation();
                onPriceClick(low);
            }
        } > {
            formatCurrency(low)
        } <
        /div> < /
        Tooltip >

        {
            /* High Price Label */
        } <
        Tooltip title = {
            `High: ${formatCurrency(high)}`
        } >
        <
        div className = "absolute right-0 top-1/2 text-xs text-muted cursor-pointer"
    onClick = {
            (e) => {
                e.stopPropagation();
                onPriceClick(high);
            }
        } > {
            formatCurrency(high)
        } <
        /div> < /
        Tooltip > <
        /div>
);
};

const MarketDepthPanel: React.FC < {
    stock: Stock;
    onPriceClick: (price: number, type: TransactionType) => void;
} > = ({
    stock,
    onPriceClick
}) => {
    const [showFullDepth, setShowFullDepth] = useState(false);
    const depth = showFullDepth ? 20 : 5;
    const bids = stock.marketDepth?.bids.slice(0, depth) || [];
    const asks = stock.marketDepth?.asks.slice(0, depth) || [];

    const totalBidQty = stock.marketDepth?.bids.reduce((sum, b) => sum + b.quantity, 0) || 0;
    const totalAskQty = stock.marketDepth?.asks.reduce((sum, a) => sum + a.quantity, 0) || 0;
    const maxQty = Math.max(
        ...(stock.marketDepth?.bids.map(d => d.quantity) || [0]),
        ...(stock.marketDepth?.asks.map(d => d.quantity) || [0])
    );

    const DepthRow: React.FC < {
        level: any;side: 'bid' | 'ask'
    } > = ({
        level,
        side
    }) => {
        const percentage = maxQty > 0 ? (level.quantity / maxQty) * 100 : 0;
        const type = side === 'bid' ? TransactionType.SELL : TransactionType.BUY;

        const priceClass = side === 'bid' ? 'text-success' : 'text-danger';
        const barBgClass = side === 'bid' ? 'bg-success/20' : 'bg-danger/20';

        return ( <
            tr className = "text-xs hover:bg-overlay/50 cursor-pointer"
            onClick = {
                () => onPriceClick(level.price, type)
            } > {
                side === 'bid' && < >
                <
                td className = "p-1 text-center text-text-secondary" > {
                    level.orders
                } < /td> <
                td className = "p-1 text-right text-text-secondary relative overflow-hidden" >
                <
                div className = {
                    `absolute top-0 bottom-0 right-0 h-full ${barBgClass}`
                }
                style = {
                    {
                        width: `${percentage}%`
                    }
                } > < /div> <
                span className = "relative z-[1]" > {
                    level.quantity.toLocaleString('en-IN')
                } < /span> < /
                td > <
                td className = {
                    `p-1 text-right font-semibold ${priceClass}`
                } > {
                    level.price.toFixed(2)
                } < /td> < /
                >
            } {
                side === 'ask' && < >
                    <
                    td className = {
                        `p-1 text-left font-semibold ${priceClass}`
                    } > {
                        level.price.toFixed(2)
                    } < /td> <
                td className = "p-1 text-right text-text-secondary relative overflow-hidden" >
                    <
                    div className = {
                        `absolute top-0 bottom-0 left-0 h-full ${barBgClass}`
                    }
                style = {
                    {
                        width: `${percentage}%`
                    }
                } > < /div> <
                span className = "relative z-[1]" > {
                        level.quantity.toLocaleString('en-IN')
                    } < /span> < /
                    td > <
                    td className = "p-1 text-center text-text-secondary" > {
                        level.orders
                    } < /td> < /
                    >
            } <
            /tr>
        );
    };

    return ( <
        div className = "bg-surface/50 p-3 animate-fade-in border-t border-overlay" >
        <
        div className = "grid grid-cols-2 gap-2 text-xs" >
        <
        table className = "w-full" >
        <
        thead >
        <
        tr className = "font-semibold text-text-secondary uppercase tracking-wider text-[11px]" >
        <
        th className = "text-center w-1/4 pb-1" > Orders < /th> <
        th className = "text-right w-1/2 pb-1" > Qty. < /th> <
        th className = "text-right w-1/4 pb-1" > Bid < /th> < /
        tr > <
        /thead> <
        tbody > {
            bids.map(bid => < DepthRow key = {
                    `bid-${bid.price}`
                }
                level = {
                    bid
                }
                side = "bid" / > )
        } < /tbody> < /
        table > <
        table className = "w-full" >
        <
        thead >
        <
        tr className = "font-semibold text-text-secondary uppercase tracking-wider text-[11px]" >
        <
        th className = "text-left w-1/4 pb-1" > Offer < /th> <
        th className = "text-right w-1/2 pb-1" > Qty. < /th> <
        th className = "text-center w-1/4 pb-1" > Orders < /th> < /
        tr > <
        /thead> <
        tbody > {
            asks.map(ask => < DepthRow key = {
                    `ask-${ask.price}`
                }
                level = {
                    ask
                }
                side = "ask" / > )
        } < /tbody> < /
        table > <
        /div> <
        div className = "grid grid-cols-2 gap-2 text-xs mt-1 text-text-primary" >
        <
        div className = "flex justify-between p-1 border-t border-overlay" > < span className = "font-bold" > Total < /span><span className="font-bold">{totalBidQty.toLocaleString('en-IN')}</span > < /div> <
        div className = "flex justify-between p-1 border-t border-overlay" > < span className = "font-bold" > Total < /span><span className="font-bold">{totalAskQty.toLocaleString('en-IN')}</span > < /div> < /
        div > <
        div className = "text-center my-1" >
        <
        Tooltip title = {
            showFullDepth ? "Show 5 depth" : "Show 20 depth"
        } >
        <
        button onClick = {
            () => setShowFullDepth(!showFullDepth)
        }
        className = "text-muted hover:text-primary text-lg leading-none" > < i className = {
            `fas fa-chevron-down transition-transform ${showFullDepth ? 'rotate-180' : ''}`
        } > < /i></button >
        <
        /Tooltip> < /
        div > <
        PriceRangeIndicator low = {
            stock.low
        }
        high = {
            stock.high
        }
        open = {
            stock.open
        }
        ltp = {
            stock.ltp
        }
        onPriceClick = {
            (price) => onPriceClick(price, TransactionType.BUY)
        }
        /> <
        div className = "grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2" >
        <
        div className = "flex justify-between" > < span className = "text-muted" > Open < /span><span className="font-semibold cursor-pointer hover:text-primary" onClick={() => onPriceClick(stock.open, TransactionType.BUY)}>{formatCurrency(stock.open)}</span > < /div> <
        div className = "flex justify-between" > < span className = "text-muted" > Prev.Close < /span><span className="font-semibold cursor-pointer hover:text-primary" onClick={() => onPriceClick(stock.prevClose, TransactionType.BUY)}>{formatCurrency(stock.prevClose)}</span > < /div> <
        div className = "flex justify-between" > < span className = "text-muted" > High < /span><span className="font-semibold cursor-pointer hover:text-primary" onClick={() => onPriceClick(stock.high, TransactionType.BUY)}>{formatCurrency(stock.high)}</span > < /div> <
        div className = "flex justify-between" > < span className = "text-muted" > Low < /span><span className="font-semibold cursor-pointer hover:text-primary" onClick={() => onPriceClick(stock.low, TransactionType.BUY)}>{formatCurrency(stock.low)}</span > < /div> <
        div className = "flex justify-between" > < span className = "text-muted" > Volume < /span><span className="font-semibold">{(stock.volume || 0).toLocaleString('en-IN')}</span > < /div> <
        div className = "flex justify-between" > < span className = "text-muted" > Avg.Price < /span><span className="font-semibold">{formatCurrency(stock.avgTradePrice || 0)}</span > < /div> <
        div className = "flex justify-between" > < span className = "text-muted" > Lower Circuit < /span><span className="font-semibold cursor-pointer hover:text-primary" onClick={() => onPriceClick(stock.lowerCircuit || 0, TransactionType.BUY)}>{formatCurrency(stock.lowerCircuit || 0)}</span > < /div> <
        div className = "flex justify-between" > < span className = "text-muted" > Upper Circuit < /span><span className="font-semibold cursor-pointer hover:text-primary" onClick={() => onPriceClick(stock.upperCircuit || 0, TransactionType.SELL)}>{formatCurrency(stock.upperCircuit || 0)}</span > < /div> < /
        div > <
        /div>
    );
};

const WatchlistSettingsPanel: React.FC < {
    settings: WatchlistSettings;
    onSettingsChange: (settings: Partial < WatchlistSettings > ) => void;
    onSort: (sortBy: SortByType) => void;
} > = ({
    settings,
    onSettingsChange,
    onSort
}) => {
    const {
        changeType,
        showOptions,
        sortBy
    } = settings;

    const handleShowOptionChange = (option: keyof typeof showOptions) => {
        onSettingsChange({
            showOptions: {
                ...showOptions,
                [option]: !showOptions[option]
            }
        });
    };

    const handleSort = (newSortBy: SortByType) => {
        onSettingsChange({
            sortBy: newSortBy
        });
        onSort(newSortBy);
    };

    return ( <
        div > {
            /* your UI goes here */
        } <
        /div>
    );
};



const showOptionsConfig: {
    key: keyof typeof showOptions,
    label: string
} [] = [{
        key: "priceChange",
        label: "Price change"
    },
    {
        key: "priceChangePercent",
        label: "Price change %"
    },
    {
        key: "priceDirection",
        label: "Price direction"
    },
    {
        key: "holdings",
        label: "Holdings"
    },
    {
        key: "notes",
        label: "Notes"
    },
    {
        key: "groupColors",
        label: "Group colors"
    }
];

return ( <
    div className = "bg-base rounded-lg border border-overlay p-3 space-y-3 text-sm animate-fade-in mb-2" > {
        /* Change Type */
    } <
    div className = "flex items-center gap-2" >
    <
    div className = "w-24 text-muted flex items-center shrink-0" >
    <
    span className = "font-semibold uppercase text-xs mr-1" > CHANGE TYPE < /span> <
    Tooltip title = "Change reference for price calculation." > < i className = "fas fa-info-circle cursor-help text-xs" > < /i></Tooltip >
    <
    /div> <
    div className = "flex gap-4" >
    <
    label className = "flex items-center cursor-pointer" >
    <
    input type = "radio"
    name = "changeType"
    value = "close"
    checked = {
        changeType === 'close'
    }
    onChange = {
        () => onSettingsChange({
            changeType: 'close'
        })
    }
    className = "h-4 w-4 text-primary bg-surface border-gray-500 focus:ring-primary focus:ring-1" / >
    <
    span className = "ml-2 text-text-secondary" > Close price < /span> < /
    label > <
    label className = "flex items-center cursor-pointer" >
    <
    input type = "radio"
    name = "changeType"
    value = "open"
    checked = {
        changeType === 'open'
    }
    onChange = {
        () => onSettingsChange({
            changeType: 'open'
        })
    }
    className = "h-4 w-4 text-primary bg-surface border-gray-500 focus:ring-primary focus:ring-1" / >
    <
    span className = "ml-2 text-text-secondary" > Open price < /span> < /
    label > <
    /div> < /
    div >

    {
        /* Show */
    } <
    div className = "flex items-start gap-2" >
    <
    div className = "w-24 text-muted shrink-0 pt-1" >
    <
    span className = "font-semibold uppercase text-xs" > SHOW < /span> < /
    div > <
    div className = "grid grid-cols-2 gap-x-4 gap-y-2" > {
        showOptionsConfig.map(({
            key,
            label
        }) => ( <
            label key = {
                key
            }
            className = "flex items-center cursor-pointer whitespace-nowrap" >
            <
            input type = "checkbox"
            checked = {
                showOptions[key]
            }
            onChange = {
                () => handleShowOptionChange(key)
            }
            className = "h-4 w-4 rounded-sm text-primary bg-surface border-gray-500 focus:ring-primary focus:ring-1" / >
            <
            span className = "ml-2 text-text-secondary" > {
                label
            } < /span> < /
            label >
        ))
    } <
    /div> < /
    div >

    {
        /* Sort By */
    } <
    div className = "flex items-start gap-2" >
    <
    div className = "w-24 text-muted shrink-0 pt-1" >
    <
    span className = "font-semibold uppercase text-xs" > SORT BY < /span> < /
    div > <
    div className = "flex-1" >
    <
    div className = "flex gap-1 flex-wrap" > {
        (['%', 'LTP', 'A-Z', 'EXCH'] as
            const).map(option => ( <
            button key = {
                option
            }
            onClick = {
                () => handleSort(option)
            }
            className = {
                `px-4 py-1.5 border rounded font-semibold ${sortBy === option ? 'bg-primary border-primary text-white' : 'bg-surface border-gray-600 text-muted hover:border-primary'}`
            } > {
                option
            } <
            /button>
        ))
    } <
    /div> <
    p className = "text-xs text-muted mt-1" > Sort items within a group. < /p> < /
    div > <
    /div> < /
    div >
);
};

const NewGroupForm: React.FC < {
    onCancel: () => void;onCreate: (name: string) => void;
} > = ({
    onCancel,
    onCreate
}) => {
    const [name, setName] = useState('');
    const colors = ['#142952', '#3B82F6', '#6366F1', '#A855F7', '#10B981', '#F59E0B', '#9CA3AF', '#EF4444'];
    const [selectedColor, setSelectedColor] = useState(colors[0]);

    const handleCreateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim());
        }
    };

    return ( <
        div className = "p-3 my-2 border border-overlay rounded-lg bg-base animate-fade-in space-y-3" >
        <
        div >
        <
        label htmlFor = "group-name"
        className = "sr-only" > Name < /label> <
        input id = "group-name"
        type = "text"
        placeholder = "Name"
        value = {
            name
        }
        onChange = {
            (e) => setName(e.target.value)
        }
        autoFocus className = "w-full bg-overlay border border-gray-600 rounded-md py-1.5 px-3 text-sm text-text-primary focus:ring-1 focus:ring-primary" /
        >
        <
        /div> <
        div className = "flex items-center gap-2" > {
            colors.map((color, index) => ( <
                button key = {
                    color
                }
                type = "button"
                onClick = {
                    () => setSelectedColor(color)
                }
                className = {
                    `w-5 h-5 rounded-full transition-transform transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-base ring-white' : ''} ${index === 0 ? 'border-2 border-gray-400' : ''}`
                }
                style = {
                    {
                        backgroundColor: index === 0 ? 'transparent' : color
                    }
                }
                aria - label = {
                    `Select color ${color}`
                }
                />
            ))
        } <
        /div> <
        div className = "flex justify-end items-center gap-2" >
        <
        button onClick = {
            handleCreateClick
        }
        className = "px-4 py-1.5 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-focus transition disabled:opacity-50"
        disabled = {
            !name.trim()
        } > Create < /button> <
        button onClick = {
            onCancel
        }
        className = "px-4 py-1.5 text-sm font-semibold text-text-secondary bg-overlay rounded-md hover:bg-base transition" > Close < /button> < /
        div > <
        /div>
    );
};


const StockRow: React.FC < {
        stock: Stock;
        settings: WatchlistSettings;
        isDiscover: boolean;
        hasNote: boolean;
        holdingQty ? : number;
        onSelect: () => void;
        onOrder: (type: TransactionType) => void;
        onRemove: () => void;
        onDragStart: (e: React.DragEvent) => void;
        onDragEnter: (e: React.DragEvent) => void;
        onDragEnd: (e: React.DragEvent) => void;
        onMouseEnter: () => void;
        onMouseLeave: () => void;
        isExpanded: boolean;
        onDepthClick: () => void;
        onMoreClick: (symbol: string, event: React.MouseEvent < HTMLButtonElement > ) => void;
    } > = ({
        stock,
        settings,
        isDiscover,
        hasNote,
        holdingQty,
        onSelect,
        onOrder,
        onRemove,
        onDragStart,
        onDragEnter,
        onDragEnd,
        onMouseEnter,
        onMouseLeave,
        isExpanded,
        onDepthClick,
        onMoreClick
    }) => {

        const referencePrice = settings.changeType === 'open' ? stock.open : stock.prevClose;
        const change = stock.ltp - referencePrice;
        const changePercent = referencePrice > 0 ? (change / referencePrice) * 100 : 0;
        const changeColor = change >= 0 ? 'text-success' : 'text-danger';

        return ( <
                div onMouseEnter = {
                    onMouseEnter
                }
                onMouseLeave = {
                    onMouseLeave
                }
                draggable = {
                    !isDiscover
                }
                onDragStart = {
                    onDragStart
                }
                onDragEnter = {
                    onDragEnter
                }
                onDragEnd = {
                    onDragEnd
                }
                className = "flex items-center p-2.5 rounded-t-lg transition-colors group/row relative hover:z-20" >
                <
                div className = "flex items-center flex-1 overflow-hidden" > {
                    !isDiscover && < span className = "text-muted cursor-grab pr-2 touch-none" > < i className = "fas fa-grip-vertical" > < /i></span >
                } <
                div className = "flex-1 min-w-0" >
                <
                div className = "flex items-center gap-2" >
                <
                p className = {
                    `font-bold truncate text-sm ${changeColor}`
                } > {
                    stock.symbol
                } < /p> {
                settings.showOptions.notes && hasNote && ( <
                    Tooltip title = "This stock has a note" > < i className = "fas fa-sticky-note text-xs text-yellow-400" > < /i></Tooltip >
                )
            } <
            /div> {
        settings.showOptions.holdings && holdingQty && ( <
            p className = "text-xs text-muted" > Qty: {
                holdingQty
            } < /p>
        )
    } <
    /div> < /
    div >

    <
    div className = "text-right transition-opacity group-hover/row:opacity-0 w-36 flex flex-col items-end" >
    <
    p className = "font-semibold text-sm" > {
        formatCurrency(stock.ltp)
    } < /p> <
div className = "flex gap-2 items-baseline" > {
    settings.showOptions.priceChange && < span className = {
        `text-xs ${changeColor}`
    } > {
        change.toFixed(2)
    } < /span>} {
    settings.showOptions.priceChangePercent && < span className = {
        `text-xs font-bold ${changeColor}`
    } > {
        formatPercent(changePercent / 100)
    } < /span>} {
    settings.showOptions.priceDirection && < i className = {
        `fas fa-caret-${change >= 0 ? 'up' : 'down'} text-xs ${changeColor}`
    } > < /i>} < /
    div > <
    /div>

    {
        !isDiscover &&
            <
            div className = "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity bg-surface p-1 rounded-md shadow-lg" >
            <
            Tooltip title = "Buy"
        shortcut = "B" >
            <
            button onClick = {
                (e) => {
                    e.stopPropagation();
                    onOrder(TransactionType.BUY);
                }
            }
        className = "w-8 h-8 rounded bg-success text-white font-bold text-sm hover:bg-green-600" > B < /button> < /
            Tooltip > <
            Tooltip title = "Sell"
        shortcut = "S" >
            <
            button onClick = {
                (e) => {
                    e.stopPropagation();
                    onOrder(TransactionType.SELL);
                }
            }
        className = "w-8 h-8 rounded bg-danger text-white font-bold text-sm hover:bg-red-600" > S < /button> < /
            Tooltip > <
            Tooltip title = {
                isExpanded ? "Hide Depth" : "Market Depth"
            }
        shortcut = "D" >
            <
            button onClick = {
                (e) => {
                    e.stopPropagation();
                    onDepthClick();
                }
            }
        className = {
                `w-8 h-8 rounded hover:bg-base text-muted ${isExpanded ? 'bg-primary/20 text-primary' : 'bg-overlay'}`
            } >
            <
            i className = "fas fa-bars" > < /i> < /
            button > <
            /Tooltip> <
        Tooltip title = "Chart"
        shortcut = "C" >
            <
            button onClick = {
                (e) => {
                    e.stopPropagation();
                    onSelect();
                }
            }
        className = "w-8 h-8 rounded bg-overlay hover:bg-base text-muted" > < i className = "fas fa-chart-line" > < /i></button >
            <
            /Tooltip> <
        Tooltip title = "Delete"
        shortcut = "Delete" >
            <
            button onClick = {
                (e) => {
                    e.stopPropagation();
                    onRemove();
                }
            }
        className = "w-8 h-8 rounded bg-overlay hover:bg-base text-muted" > < i className = "fas fa-trash-alt" > < /i></button >
            <
            /Tooltip> <
        Tooltip title = "More" >
            <
            button
        onMouseDown = {
            (e) => {
                e.stopPropagation();
                e.preventDefault();
                onMoreClick(stock.symbol, e);
            }
        }
        className = "w-8 h-8 rounded bg-overlay hover:bg-base text-muted" >
            <
            i className = "fas fa-ellipsis-h" > < /i> < /
            button > <
            /Tooltip> < /
            div >
    } <
    /div>
);
};

const EditGroupForm: React.FC < {
    group: WatchlistGroup;
    onUpdate: (newName: string, newColor ? : string) => void;
    onClose: () => void;
} > = ({
    group,
    onUpdate,
    onClose
}) => {
    const [name, setName] = useState(group.name);
    const colors = ['#3B82F6', '#6366F1', '#A855F7', '#10B981', '#F59E0B', '#9CA3AF', '#EF4444'];
    const defaultColor = 'transparent';
    const [selectedColor, setSelectedColor] = useState(group.color || defaultColor);

    const handleUpdate = () => {
        if (name.trim()) {
            onUpdate(name.trim(), selectedColor === defaultColor ? undefined : selectedColor);
        }
    };

    return ( <
        div className = "p-2 space-y-3 bg-base border border-overlay rounded-b-md animate-fade-in"
        onClick = {
            e => e.stopPropagation()
        } >
        <
        input type = "text"
        value = {
            name
        }
        onChange = {
            (e) => setName(e.target.value)
        }
        autoFocus className = "w-full bg-overlay border border-gray-600 rounded-md py-1.5 px-3 text-sm text-text-primary" /
        >
        <
        div className = "flex items-center gap-2" >
        <
        button type = "button"
        onClick = {
            () => setSelectedColor(defaultColor)
        }
        className = {
            `w-5 h-5 rounded-full transition-transform transform hover:scale-110 flex items-center justify-center bg-grid-pattern ${selectedColor === defaultColor ? 'ring-2 ring-offset-2 ring-offset-base ring-white' : ''}`
        }
        style = {
            {
                backgroundImage: 'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            }
        }
        aria - label = "No color" /
        >
        {
            colors.map((color) => ( <
                button key = {
                    color
                }
                type = "button"
                onClick = {
                    () => setSelectedColor(color)
                }
                className = {
                    `w-5 h-5 rounded-full transition-transform transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-base ring-white' : ''}`
                }
                style = {
                    {
                        backgroundColor: color
                    }
                }
                aria - label = {
                    `Select color ${color}`
                }
                />
            ))
        } <
        /div> <
        div className = "flex justify-end gap-2" >
        <
        button onClick = {
            handleUpdate
        }
        className = "px-4 py-1.5 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-focus transition" > Update < /button> <
        button onClick = {
            onClose
        }
        className = "px-4 py-1.5 text-sm font-semibold text-text-secondary bg-overlay rounded-md hover:bg-base transition" > Close < /button> < /
        div > <
        /div>
    );
};

// Modals
const MoveGroupModal: React.FC < {
    group: WatchlistGroup;onClose: () => void;onMove: (targetWatchlistId: number) => void;panelRef: React.RefObject < HTMLDivElement >
} > = ({
    group,
    onClose,
    onMove,
    panelRef
}) => {
    const {
        watchlists,
        activeView
    } = useWatchlist();
    const currentWatchlistId = activeView.type === 'watchlist' ? activeView.id : -1;
    const availableWatchlists = watchlists.filter(w => w.id !== currentWatchlistId);
    const [targetId, setTargetId] = useState < number | undefined > (availableWatchlists[0]?.id);

    const modalRef = useRef < HTMLDivElement > (null);
    const [style, setStyle] = useState < React.CSSProperties > ({});

    useLayoutEffect(() => {
        if (panelRef.current && modalRef.current) {
            const panelRect = panelRef.current.getBoundingClientRect();
            const modalRect = modalRef.current.getBoundingClientRect();

            const top = panelRect.top + (panelRect.height - modalRect.height) / 2;
            const left = panelRect.left + (panelRect.width - modalRect.width) / 2;

            setStyle({
                position: 'fixed',
                top: `${Math.max(top, 16)}px`,
                left: `${Math.max(left, 16)}px`,
                width: modalRef.current.offsetWidth // Keep width constant
            });
        }
    }, [panelRef]);


    const handleMove = () => {
        if (targetId !== undefined) {
            onMove(targetId);
        }
    };
    const currentWatchlist = watchlists.find(w => w.id === currentWatchlistId);

    return createPortal( <
        div className = "fixed inset-0 bg-black bg-opacity-85 z-50 animate-fade-in"
        onClick = {
            onClose
        } >
        <
        div ref = {
            modalRef
        }
        style = {
            style
        }
        className = "bg-surface rounded-lg shadow-2xl w-full max-w-sm p-6 space-y-4"
        onClick = {
            e => e.stopPropagation()
        } >
        <
        h3 className = "text-xl font-bold text-text-primary" > Move to lists < /h3> <
        p className = "text-sm text-muted" >
        Move group - < span className = "font-semibold text-text-primary" > {
            group.name
        } < /span> from current watchlist - <span className="font-semibold text-text-primary">{currentWatchlist?.name}</span > to <
        /p> <
        select value = {
            targetId
        }
        onChange = {
            e => setTargetId(Number(e.target.value))
        }
        className = "w-full bg-base border border-gray-600 rounded-md p-2 text-text-primary focus:ring-1 focus:ring-primary focus:border-primary" > {
            availableWatchlists.map(w => ( <
                option key = {
                    w.id
                }
                value = {
                    w.id
                } > {
                    w.name
                } < /option>
            ))
        } <
        /select> <
        div className = "flex justify-end gap-2" >
        <
        button onClick = {
            onClose
        }
        className = "px-4 py-2 text-sm font-semibold rounded-md bg-overlay hover:bg-base text-text-secondary hover:text-text-primary transition-colors" > Cancel < /button> <
        button onClick = {
            handleMove
        }
        className = "px-4 py-2 text-sm font-semibold rounded-md bg-primary hover:bg-primary-focus text-white" > Move < /button> < /
        div > <
        /div> < /
        div > ,
        document.body
    );
};

const SortGroupModal: React.FC < {
    group: WatchlistGroup;onClose: () => void;onSort: (sortBy: '%' | 'LTP' | 'A-Z' | 'EXCH') => void;panelRef: React.RefObject < HTMLDivElement >
} > = ({
    group,
    onClose,
    onSort,
    panelRef
}) => {
    type SortByType = '%' | 'LTP' | 'A-Z' | 'EXCH';
    const [sortBy, setSortBy] = useState < SortByType > ('A-Z');

    const modalRef = useRef < HTMLDivElement > (null);
    const [style, setStyle] = useState < React.CSSProperties > ({});

    useLayoutEffect(() => {
        if (panelRef.current && modalRef.current) {
            const panelRect = panelRef.current.getBoundingClientRect();
            const modalRect = modalRef.current.getBoundingClientRect();

            const top = panelRect.top + (panelRect.height - modalRect.height) / 2;
            const left = panelRect.left + (panelRect.width - modalRect.width) / 2;

            setStyle({
                position: 'fixed',
                top: `${Math.max(top, 16)}px`,
                left: `${Math.max(left, 16)}px`,
                width: modalRef.current.offsetWidth
            });
        }
    }, [panelRef]);

    const sortOptions: {
        key: SortByType,
        label: string
    } [] = [{
            key: '%',
            label: '%'
        },
        {
            key: 'LTP',
            label: 'LTP'
        },
        {
            key: 'A-Z',
            label: 'A-Z'
        },
        {
            key: 'EXCH',
            label: 'EXCH'
        }
    ];

    const handleSave = () => {
        onSort(sortBy);
    };

    return createPortal( <
        div className = "fixed inset-0 bg-black bg-opacity-85 z-50 animate-fade-in"
        onClick = {
            onClose
        } >
        <
        div ref = {
            modalRef
        }
        style = {
            style
        }
        className = "bg-surface rounded-lg shadow-2xl w-full max-w-xs p-6 space-y-4"
        onClick = {
            e => e.stopPropagation()
        } >
        <
        h3 className = "text-xl font-bold text-center text-text-primary" > Sort by < /h3> <
        div className = "grid grid-cols-2 gap-2" > {
            sortOptions.map(opt => ( <
                button key = {
                    opt.key
                }
                onClick = {
                    () => setSortBy(opt.key)
                }
                className = {
                    `px-4 py-2 text-sm font-semibold rounded-md border transition-colors ${sortBy === opt.key ? 'bg-primary text-white border-primary' : 'bg-base text-muted border-gray-600 hover:border-primary hover:text-text-primary'}`
                } > {
                    opt.label
                } <
                /button>
            ))
        } <
        /div> <
        div className = "flex justify-center gap-2 pt-2" >
        <
        button onClick = {
            handleSave
        }
        className = "px-6 py-2 text-sm font-semibold rounded-md bg-primary hover:bg-primary-focus text-white" > Save < /button> <
        button onClick = {
            onClose
        }
        className = "px-6 py-2 text-sm font-semibold rounded-md bg-overlay hover:bg-base text-text-secondary hover:text-text-primary transition-colors" > Close < /button> < /
        div > <
        /div> < /
        div > ,
        document.body
    );
};


const WatchlistPanel: React.FC < WatchlistPanelProps > = ({
        activeList,
        isDiscover,
        selectedStock,
        onStockSelect,
        onOrderAction,
        onCreateGTT,
        onCreateAlert,
        onShowMarketDepthModal
    }) => {
        const [query, setQuery] = useState('');
        const [isSettingsOpen, setIsSettingsOpen] = useState(false);
        const [isCreatingGroup, setIsCreatingGroup] = useState(false);
        const [hoveredStockInfo, setHoveredStockInfo] = useState < {
            stock: Stock,
            groupId: string
        } | null > (null);
        const [expandedSymbol, setExpandedSymbol] = useState < string | null > (null);
        const [notesOpenForSymbol, setNotesOpenForSymbol] = useState < string | null > (null);
        const [activeMoreMenu, setActiveMoreMenu] = useState < {
            symbol: string;triggerEl: HTMLElement
        } | null > (null);
        const [activeGroupId, setActiveGroupId] = useState < string | null > (null);
        const [editingGroupId, setEditingGroupId] = useState < string | null > (null);
        const [draggingType, setDraggingType] = useState < 'stock' | 'group' | null > (null);

        // State for modals and group menu
        const [moveModalState, setMoveModalState] = useState < {
            isOpen: boolean,
            group: WatchlistGroup | null
        } > ({
            isOpen: false,
            group: null
        });
        const [sortModalState, setSortModalState] = useState < {
            isOpen: boolean,
            group: WatchlistGroup | null
        } > ({
            isOpen: false,
            group: null
        });
        const [activeGroupMenu, setActiveGroupMenu] = useState < string | null > (null);

        const {
            addStockToGroup,
            removeStockFromGroup,
            reorderStockInGroup,
            reorderGroups,
            toggleGroupCollapse,
            toggleGroupMaximize,
            updateGroup,
            addGroup,
            pinStock,
            removeGroup,
            moveGroupToWatchlist,
            updateGroupSymbols,
            updateWatchlistSettings,
            sortAllAssetsInWatchlist,
            addWatchlistFromDiscover
        } = useWatchlist();
        const {
            marketData,
            loading: marketLoading,
            portfolio
        } = usePortfolio();

        const holdingsMap = useMemo(() => {
            const map = new Map < string,
                number > ();
            portfolio.positions.forEach(p => map.set(p.symbol, p.quantity));
            return map;
        }, [portfolio.positions]);

        const panelRef = useRef < HTMLDivElement > (null);
        const searchInputRef = useRef < HTMLInputElement > (null);
        const searchContainerRef = useRef < HTMLDivElement > (null);
        const settingsPanelRef = useRef < HTMLDivElement > (null);
        const scrollContainerRef = useRef < HTMLDivElement > (null);
        const searchResultsRef = useRef < HTMLDivElement > (null);
        const prevGroupsRef = useRef(activeList.groups);
        const groupMenuRef = useRef < HTMLDivElement > (null);

        // Refs for stock dragging
        const dragItem = useRef < {
            group: string;index: number
        } | null > (null);
        const dragOverItem = useRef < {
            group: string;index: number
        } | null > (null);

        // Refs for group dragging
        const dragGroupIndex = useRef < number | null > (null);
        const dragOverGroupIndex = useRef < number | null > (null);

        const handlePriceClickForOrder = (stock: Stock, price: number, type: TransactionType) => {
            onOrderAction({
                stock,
                type,
                price,
                orderType: OrderType.LIMIT,
            });
        };

        // Handlers for STOCK dragging
        const handleStockDragStart = (e: React.DragEvent, index: number, groupId: string) => {
            dragItem.current = {
                group: groupId,
                index
            };
            setDraggingType('stock');
        };

        const handleStockDragEnter = (e: React.DragEvent, index: number, groupId: string) => {
            if (draggingType !== 'stock') return;
            dragOverItem.current = {
                group: groupId,
                index
            };
        };

        const handleStockDragEnd = () => {
            if (draggingType !== 'stock') return;
            if (dragItem.current && dragOverItem.current && dragItem.current.group === dragOverItem.current.group) {
                reorderStockInGroup(activeList.id, dragItem.current.group, dragItem.current.index, dragOverItem.current.index);
            }
            dragItem.current = null;
            dragOverItem.current = null;
            setDraggingType(null);
        };

        // Handlers for GROUP dragging
        const handleGroupDragStart = (e: React.DragEvent, index: number) => {
            e.stopPropagation(); // Prevent parent draggable elements from firing
            dragGroupIndex.current = index;
            setDraggingType('group');
        };

        const handleGroupDragEnter = (e: React.DragEvent, index: number) => {
            if (draggingType !== 'group') return;
            dragOverGroupIndex.current = index;
        };

        const handleGroupDragEnd = () => {
            if (draggingType !== 'group') return;
            if (dragGroupIndex.current !== null && dragOverGroupIndex.current !== null && dragGroupIndex.current !== dragOverGroupIndex.current) {
                reorderGroups(activeList.id, dragGroupIndex.current, dragOverGroupIndex.current);
            }
            dragGroupIndex.current = null;
            dragOverGroupIndex.current = null;
            setDraggingType(null);
        };

        useEffect(() => {
            const prevGroups = prevGroupsRef.current;
            const currentGroups = activeList.groups;

            let activeGroupSet = false;

            if (currentGroups && prevGroups && currentGroups.length > prevGroups.length) {
                const prevGroupIds = new Set(prevGroups.map(g => g.id));
                const newGroup = currentGroups.find(g => !prevGroupIds.has(g.id));
                if (newGroup) {
                    setActiveGroupId(newGroup.id);
                    activeGroupSet = true;
                    if (newGroup.isCollapsed) {
                        toggleGroupCollapse(activeList.id, newGroup.id);
                    }
                }
            }

            prevGroupsRef.current = currentGroups;

            if (activeGroupSet) return;

            if (currentGroups && currentGroups.length > 0) {
                const groupExists = currentGroups.some(g => g.id === activeGroupId);
                if (!groupExists || isDiscover) {
                    setActiveGroupId(currentGroups[0].id);
                }
            } else {
                setActiveGroupId(null);
            }
        }, [activeList, activeGroupId, toggleGroupCollapse, isDiscover]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const isOutsideSearch = searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node);
                const isOutsideInput = searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node);

                if (isOutsideSearch && isOutsideInput) {
                    if (query) {
                        setQuery('');
                    }
                }
                if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
                    setActiveGroupMenu(null);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [query]);

        // Updated: Use capture phase for better outside click detection
        useEffect(() => {
            if (!activeMoreMenu) return;

            const handleOutside = (e: MouseEvent) => {
                const inMenu = (e.target as Element)?.closest('[data-more-menu-container]');
                const onTrigger = activeMoreMenu.triggerEl.contains(e.target as Node);
                if (!inMenu && !onTrigger) {
                    setActiveMoreMenu(null);
                }
            };

            document.addEventListener('mousedown', handleOutside, true);
            return () => document.removeEventListener('mousedown', handleOutside, true);
        }, [activeMoreMenu]);


        useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.target instanceof HTMLInputElement ||
                    event.target instanceof HTMLTextAreaElement ||
                    (event.target as HTMLElement).isContentEditable) {
                    return;
                }

                if (activeGroupId) {
                    if (event.code === 'Space' && !event.shiftKey) {
                        event.preventDefault();
                        toggleGroupCollapse(activeList.id, activeGroupId);
                    }
                    if (event.code === 'Space' && event.shiftKey) {
                        event.preventDefault();
                        toggleGroupMaximize(activeList.id, activeGroupId);
                    }
                }

                const stock = hoveredStockInfo?.stock;
                const groupId = hoveredStockInfo?.groupId;

                if (stock && !isDiscover) {
                    if (event.key.toLowerCase() === 'b') {
                        event.preventDefault();
                        onOrderAction({
                            stock: stock,
                            type: TransactionType.BUY
                        });
                    } else if (event.key.toLowerCase() === 's') {
                        event.preventDefault();
                        onOrderAction({
                            stock: stock,
                            type: TransactionType.SELL
                        });
                    } else if (event.key.toLowerCase() === 'c') {
                        event.preventDefault();
                        onStockSelect(stock);
                    } else if (event.key.toLowerCase() === 'd') {
                        event.preventDefault();
                        setExpandedSymbol(prev => prev === stock.symbol ? null : stock.symbol);
                    } else if (event.key === 'Delete' && groupId) {
                        event.preventDefault();
                        removeStockFromGroup(activeList.id, groupId, stock.symbol);
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }, [hoveredStockInfo, onOrderAction, onStockSelect, removeStockFromGroup, activeList.id, activeGroupId, toggleGroupCollapse, toggleGroupMaximize, isDiscover]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const isTriggerClicked = searchContainerRef.current?.contains(event.target as Node);
                if (isTriggerClicked) return;
                const isPanelClicked = settingsPanelRef.current?.contains(event.target as Node);
                if (!isPanelClicked) {
                    setIsSettingsOpen(false);
                }
            };

            if (isSettingsOpen) {
                document.addEventListener("mousedown", handleClickOutside);
            }

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [isSettingsOpen]);

        useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
                    event.preventDefault();
                    searchInputRef.current?.focus();
                }
                if (event.key === 'Escape') {
                    setActiveMoreMenu(null);
                    setEditingGroupId(null);
                    setActiveGroupMenu(null);
                    setMoveModalState({
                        isOpen: false,
                        group: null
                    });
                    setSortModalState({
                        isOpen: false,
                        group: null
                    });
                    setNotesOpenForSymbol(null);
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }, []);

        const stocksInWatchlist = useMemo(() => {
            const symbols = activeList.groups.flatMap(g => g.symbols);
            return marketData.filter(stock => symbols.includes(stock.symbol));
        }, [activeList, marketData]);

        const searchResults = useMemo(() => {
            if (!query) return [];
            const lowerCaseQuery = query.toLowerCase();
            const watchlistSymbols = new Set(stocksInWatchlist.map(s => s.symbol));
            return marketData.filter(s =>
                !watchlistSymbols.has(s.symbol) &&
                (s.symbol.toLowerCase().includes(lowerCaseQuery) ||
                    s.name.toLowerCase().includes(lowerCaseQuery))
            ).slice(0, 10);
        }, [marketData, query, stocksInWatchlist]);

        const scrollToTop = () => {
            scrollContainerRef.current?.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
        const scrollToBottom = () => {
            scrollContainerRef.current?.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        };

        const handleCreateGroup = (name: string) => {
            addGroup(activeList.id, name);
            setIsCreatingGroup(false);
        };

        // Updated handleMoreClick
        const handleMoreClick = (symbol: string, event: React.MouseEvent < HTMLButtonElement > ) => {
            const target = event.currentTarget;
            setActiveMoreMenu(prev =>
                prev?.symbol === symbol ? null : {
                    symbol,
                    triggerEl: target
                }
            );
        };

        const handleToggleNotes = (symbol: string) => {
            setNotesOpenForSymbol(prev => (prev === symbol ? null : symbol));
            // close other panels if open
            setExpandedSymbol(null);
        };

        const allSymbolsInActiveWl = activeList.groups.flatMap(g => g.symbols) || [];

        if (marketLoading) {
            return < p className = "text-muted p-4 text-center" > Loading... < /p>;
        }

        const totalStocks = activeList.groups.reduce((acc, group) => acc + group.symbols.length, 0);

        return ( <
                div ref = {
                    panelRef
                }
                className = "flex flex-col h-full" > {
                    /* NON-SCROLLABLE HEADER AREA */
                } <
                div className = "shrink-0" >
                <
                div className = "p-3 border-b border-overlay" >
                <
                div className = "relative z-30"
                ref = {
                    searchContainerRef
                } >
                <
                i className = "fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted z-10" > < /i> {!isDiscover &&
                <
                div className = "absolute right-3 top-1/2 -translate-y-1/2 text-muted z-10 flex items-center gap-2" >
                <
                div className = "text-xs border border-gray-600 rounded px-1.5 py-0.5" > Ctrl + K < /div> <
                Tooltip title = "Settings" >
                <
                button onClick = {
                    () => setIsSettingsOpen(prev => !prev)
                }
                className = {
                    `text-muted hover:text-text-primary ${isSettingsOpen ? 'text-primary' : ''}`
                } >
                <
                i className = "fas fa-sliders-h" > < /i> < /
                button > <
                /Tooltip> < /
                div >
            } <
            input ref = {
                searchInputRef
            }
        type = "text"
        placeholder = "Search eg: infy bse, nifty fut, index fund, etc"
        value = {
            query
        }
        onFocus = {
            () => {
                if (isSettingsOpen) setIsSettingsOpen(false);
            }
        }
        onChange = {
            (e) => {
                setQuery(e.target.value);
                if (isSettingsOpen) setIsSettingsOpen(false);
            }
        }
        className = "w-full bg-base border border-gray-600 rounded-md py-2 pl-10 pr-28 text-text-primary focus:ring-1 focus:ring-primary focus:border-primary" /
            >

            {
                query && !isDiscover && ( <
                    div ref = {
                        searchResultsRef
                    }
                    className = "absolute top-full left-0 right-0 mt-1 bg-base border border-overlay rounded-md shadow-lg z-20 max-h-60 overflow-y-auto custom-scrollbar" > {
                        searchResults.length > 0 ? (
                            searchResults.map(stock => ( <
                                div key = {
                                    stock.symbol
                                }
                                className = "p-2 hover:bg-overlay flex items-center justify-between" >
                                <
                                div >
                                <
                                p className = "font-semibold text-sm" > {
                                    stock.symbol
                                } < /p> <
                                p className = "text-xs text-muted" > {
                                    stock.name
                                } < /p> < /
                                div > <
                                Tooltip title = {
                                    activeGroupId ? `Add to '${activeList.groups.find(g => g.id === activeGroupId)?.name}'` : 'Select a group first'
                                } >
                                <
                                div > {
                                    /* div wrapper needed for tooltip on disabled button */
                                } <
                                button onClick = {
                                    () => {
                                        if (activeGroupId) {
                                            addStockToGroup(activeList.id, activeGroupId, stock.symbol);
                                            setQuery('');
                                        }
                                    }
                                }
                                disabled = {
                                    !activeGroupId
                                }
                                className = "text-primary text-xl hover:text-primary-focus disabled:text-muted disabled:cursor-not-allowed"
                                aria - label = {
                                    `Add ${stock.symbol} to active group`
                                } >
                                <
                                i className = "fas fa-plus-circle" > < /i> < /
                                button > <
                                /div> < /
                                Tooltip > <
                                /div>
                            ))
                        ) : ( <
                            p className = "p-3 text-sm text-center text-muted" > No results found. < /p>
                        )
                    } <
                    /div>
                )
            } <
            /div> < /
            div >

            <
            div className = "p-2" >
            <
            div className = "flex justify-between items-center px-1 relative z-20" >
            <
            div className = "flex items-center gap-2" >
            <
            p className = "text-text-primary" > {
                activeList.name
            } < span className = "text-sm text-muted" > ({
                    totalStocks
                }
                / 250)</span > < /p> {!isDiscover &&
                <
                >
                <
                Tooltip title = "Scroll to bottom" >
                <
                button onClick = {
                    scrollToBottom
                }
                className = "text-text-secondary text-sm hover:text-text-primary leading-none" > ↓ < /button> < /
                Tooltip > <
                Tooltip title = "Scroll to top" >
                <
                button onClick = {
                    scrollToTop
                }
                className = "text-text-secondary text-sm hover:text-text-primary leading-none" > ↑ < /button> < /
                Tooltip > <
                />
            } <
            /div> {
        isDiscover ? ( <
            button onClick = {
                () => addWatchlistFromDiscover({
                    name: activeList.name,
                    symbols: allSymbolsInActiveWl
                })
            }
            className = "text-sm text-primary hover:underline font-semibold" > +Add to my lists < /button>
        ) : ( <
            Tooltip title = "Create a group" >
            <
            button onClick = {
                () => setIsCreatingGroup(!isCreatingGroup)
            }
            className = "text-sm text-primary hover:underline font-semibold" > +New group < /button> < /
            Tooltip >
        )
    } <
    /div> {
isCreatingGroup && < NewGroupForm onCreate = {
    handleCreateGroup
}
onCancel = {
    () => setIsCreatingGroup(false)
}
/>} {
isSettingsOpen && !isDiscover && ( <
    div ref = {
        settingsPanelRef
    } >
    <
    WatchlistSettings settings = {
        activeList.settings
    }
    onSettingsChange = {
        (newSettings) => updateWatchlistSettings(activeList.id, newSettings)
    }
    onSort = {
        (sortBy) => sortAllAssetsInWatchlist(activeList.id, sortBy, marketData)
    }
    /> < /
    div >
)
} <
/div> < /
div >

    {
        /* SCROLLABLE CONTENT AREA */
    } <
    div className = "flex-1 overflow-y-auto custom-scrollbar p-2 pt-0 min-h-0"
ref = {
scrollContainerRef
} > {
allSymbolsInActiveWl.length === 0 && !query && !isCreatingGroup && !isDiscover ? ( <
    div className = "flex flex-col items-center justify-center text-center text-muted p-4 py-10" >
    <
    i className = "fas fa-layer-group text-5xl text-gray-500 mb-4" > < /i> <
    p className = "text-text-secondary mb-6" > You don 't have any stocks in your watchlist.</p> <
    button onClick = {
        () => searchInputRef.current?.focus()
    }
    className = "bg-primary hover:bg-primary-focus text-white font-semibold py-2 px-6 rounded-md text-sm transition-colors" >
    Add a stock <
    /button> < /
    div >
) : (
    activeList.groups.map((group, groupIndex) => {
            const isEditing = editingGroupId === group.id;
            return ( <
                    div key = {
                        group.id
                    }
                    className = {
                        `mb-1 rounded-md transition-colors ${!isDiscover && activeGroupId === group.id ? 'bg-primary/10' : ''}`
                    }
                    style = {
                        activeList.settings.showOptions.groupColors && group.color ? {
                            borderLeft: `3px solid ${group.color}`
                        } : {}
                    }
                    onDragEnter = {
                        (e) => handleGroupDragEnter(e, groupIndex)
                    }
                    onDragOver = {
                        (e) => e.preventDefault()
                    } >
                    <
                    div className = {
                        `flex justify-between items-center px-2.5 py-2 sticky top-0 bg-surface z-10 rounded-t-md ${!isDiscover ? 'cursor-pointer' : ''} ${!isDiscover && activeGroupId === group.id ? 'bg-primary/20' : 'hover:bg-overlay/30'}`
                    }
                    onClick = {
                        () => {
                            if (!isEditing && !isDiscover) {
                                setActiveGroupId(group.id)
                            }
                        }
                    } >
                    <
                    div className = "flex items-center gap-2 flex-1 min-w-0" > {
                        !group.isMaximized && !isDiscover && ( <
                            span className = "text-muted cursor-grab touch-none"
                            draggable onDragStart = {
                                (e) => handleGroupDragStart(e, groupIndex)
                            }
                            onDragEnd = {
                                handleGroupDragEnd
                            } >
                            <
                            i className = "fas fa-grip-vertical" > < /i> < /
                            span >
                        )
                    } <
                    h3 className = {
                        `text-sm font-semibold truncate ${!isDiscover && activeGroupId === group.id ? 'text-primary' : ''}`
                    }
                    title = {
                        group.name
                    } > {
                        group.name
                    } <
                    /h3> <
                    span className = "text-muted text-sm" > ({
                        group.symbols.length
                    }) < /span> < /
                    div >

                    {
                        !isDiscover &&
                        <
                        div className = "flex items-center gap-3 text-muted text-xs" >
                        <
                        Tooltip title = {
                            group.isCollapsed ? "Expand" : "Collapse"
                        }
                        shortcut = "Space" >
                        <
                        button onClick = {
                            (e) => {
                                e.stopPropagation();
                                toggleGroupCollapse(activeList.id, group.id);
                            }
                        } >
                        <
                        i className = {
                            `fas fa-chevron-up transition-transform ${group.isCollapsed ? 'rotate-180' : ''}`
                        } > < /i> < /
                        button > <
                        /Tooltip> <
                        Tooltip title = {
                            group.isMaximized ? "Minimize" : "Maximize"
                        }
                        shortcut = "Shift + Space" >
                        <
                        button onClick = {
                            (e) => {
                                e.stopPropagation();
                                toggleGroupMaximize(activeList.id, group.id);
                            }
                        } >
                        <
                        i className = {
                            `fas ${group.isMaximized ? 'fa-compress' : 'fa-expand'}`
                        } > < /i> < /
                        button > <
                        /Tooltip> <
                        Tooltip title = "Edit group" >
                        <
                        button onClick = {
                            (e) => {
                                e.stopPropagation();
                                setEditingGroupId(isEditing ? null : group.id);
                            }
                        } >
                        <
                        i className = "fas fa-pencil-alt" > < /i> < /
                        button > <
                        /Tooltip> <
                        div className = "relative" >
                        <
                        Tooltip title = "More options" >
                        <
                        button onClick = {
                            (e) => {
                                e.stopPropagation();
                                setActiveGroupMenu(activeGroupMenu === group.id ? null : group.id);
                            }
                        } >
                        <
                        i className = "fas fa-ellipsis-h" > < /i> < /
                        button > <
                        /Tooltip> {
                        activeGroupMenu === group.id && ( <
                            div ref = {
                                groupMenuRef
                            }
                            onMouseLeave = {
                                () => setActiveGroupMenu(null)
                            }
                            className = "absolute top-full right-0 mt-1 w-32 bg-base border border-overlay rounded-md shadow-lg z-20 animate-fade-in" >
                            <
                            ul >
                            <
                            li >
                            <
                            Tooltip title = "Move group to another list" >
                            <
                            button onClick = {
                                () => {
                                    setMoveModalState({
                                        isOpen: true,
                                        group
                                    });
                                    setActiveGroupMenu(null);
                                }
                            }
                            className = "w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-overlay text-sm" >
                            <
                            i className = "fas fa-random w-4 text-center text-muted" > < /i> Move < /
                            button > <
                            /Tooltip> < /
                            li > <
                            li >
                            <
                            Tooltip title = "Sort stocks in this group" >
                            <
                            button onClick = {
                                () => {
                                    setSortModalState({
                                        isOpen: true,
                                        group
                                    });
                                    setActiveGroupMenu(null);
                                }
                            }
                            className = "w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-overlay text-sm" >
                            <
                            i className = "fas fa-sort-amount-up w-4 text-center text-muted" > < /i> Sort < /
                            button > <
                            /Tooltip> < /
                            li > <
                            li >
                            <
                            Tooltip title = "Delete this group" >
                            <
                            button onClick = {
                                () => {
                                    if (window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
                                        removeGroup(activeList.id, group.id);
                                    }
                                    setActiveGroupMenu(null);
                                }
                            }
                            className = "w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-overlay text-sm text-danger" >
                            <
                            i className = "fas fa-trash-alt w-4 text-center" > < /i> Delete < /
                            button > <
                            /Tooltip> < /
                            li > <
                            /ul> < /
                            div >
                        )
                    } <
                    /div> < /
                    div >
                } <
                /div>

            {
                isEditing && ( <
                    EditGroupForm group = {
                        group
                    }
                    onUpdate = {
                        (newName, newColor) => {
                            updateGroup(activeList.id, group.id, newName, newColor);
                            setEditingGroupId(null);
                        }
                    }
                    onClose = {
                        () => setEditingGroupId(null)
                    }
                    />
                )
            } {
                !group.isCollapsed && ( <
                        div onDragOver = {
                            (e) => e.preventDefault()
                        } > {
                            group.symbols.map((symbol, index) => {
                                    const stock = marketData.find(s => s.symbol === symbol);
                                    if (!stock) return null;
                                    const isExpanded = expandedSymbol === stock.symbol;
                                    const isNotesOpen = notesOpenForSymbol === stock.symbol;
                                    const hasNote = !!activeList.notes?.[stock.symbol];
                                    return ( <
                                            div key = {
                                                stock.symbol
                                            }
                                            className = {
                                                `rounded-lg transition-colors duration-200 ${isExpanded || isNotesOpen ? 'bg-base shadow-lg' : 'hover:bg-overlay/50'}`
                                            } >
                                            <
                                            StockRow stock = {
                                                stock
                                            }
                                            settings = {
                                                activeList.settings
                                            }
                                            isDiscover = {
                                                isDiscover
                                            }
                                            holdingQty = {
                                                holdingsMap.get(stock.symbol)
                                            }
                                            hasNote = {
                                                hasNote
                                            }
                                            onSelect = {
                                                () => onStockSelect(stock)
                                            }
                                            onOrder = {
                                                (type) => onOrderAction({
                                                    stock,
                                                    type
                                                })
                                            }
                                            onRemove = {
                                                () => removeStockFromGroup(activeList.id, group.id, stock.symbol)
                                            }
                                            onDragStart = {
                                                (e) => handleStockDragStart(e, index, group.id)
                                            }
                                            onDragEnter = {
                                                (e) => handleStockDragEnter(e, index, group.id)
                                            }
                                            onDragEnd = {
                                                handleStockDragEnd
                                            }
                                            onMouseEnter = {
                                                () => setHoveredStockInfo({
                                                    stock,
                                                    groupId: group.id
                                                })
                                            }
                                            onMouseLeave = {
                                                () => setHoveredStockInfo(null)
                                            }
                                            isExpanded = {
                                                isExpanded
                                            }
                                            onDepthClick = {
                                                () => setExpandedSymbol(isExpanded ? null : stock.symbol)
                                            }
                                            onMoreClick = {
                                                handleMoreClick
                                            }
                                            /> {
                                            isExpanded && stock.marketDepth && ( <
                                                MarketDepthPanel stock = {
                                                    stock
                                                }
                                                onPriceClick = {
                                                    (price, type) => handlePriceClickForOrder(stock, price, type)
                                                }
                                                />
                                            )
                                        } {
                                            isNotesOpen && ( <
                                                NotesEditor watchlistId = {
                                                    activeList.id
                                                }
                                                stockSymbol = {
                                                    stock.symbol
                                                }
                                                onClose = {
                                                    () => setNotesOpenForSymbol(null)
                                                }
                                                />
                                            )
                                        } <
                                        /div>
                                );
                            })
                    } <
                    /div>
            )
        } <
        /div>
    )
})
)
} <
/div> {
activeMoreMenu && ( <
    MoreOptionsMenu stock = {
        marketData.find(s => s.symbol === activeMoreMenu.symbol) !
    }
    triggerEl = {
        activeMoreMenu.triggerEl
    }
    onClose = {
        () => setActiveMoreMenu(null)
    }
    onPin = {
        pinStock
    }
    onCreateGTT = {
        () => onCreateGTT(activeMoreMenu.symbol)
    }
    onCreateAlert = {
        () => onCreateAlert(activeMoreMenu.symbol)
    }
    onShowNotes = {
        () => handleToggleNotes(activeMoreMenu.symbol)
    }
    onShowMarketDepthModal = {
        () => onShowMarketDepthModal(activeMoreMenu.symbol)
    }
    />
)
} {
    moveModalState.isOpen && moveModalState.group && ( <
        MoveGroupModal group = {
            moveModalState.group
        }
        panelRef = {
            panelRef
        }
        onClose = {
            () => setMoveModalState({
                isOpen: false,
                group: null
            })
        }
        onMove = {
            (targetWatchlistId) => {
                moveGroupToWatchlist(activeList.id, moveModalState.group!.id, targetWatchlistId);
                setMoveModalState({
                    isOpen: false,
                    group: null
                });
            }
        }
        />
    )
} {
    sortModalState.isOpen && sortModalState.group && ( <
        SortGroupModal group = {
            sortModalState.group
        }
        panelRef = {
            panelRef
        }
        onClose = {
            () => setSortModalState({
                isOpen: false,
                group: null
            })
        }
        onSort = {
            (sortBy) => {
                sortAllAssetsInWatchlist(activeList.id, sortBy, marketData);
                setSortModalState({
                    isOpen: false,
                    group: null
                });
            }
        }
        />
    )
} <
/div>
);
};

export default WatchlistPanel;