
import React, { useState, Fragment, useId, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { DISCOVER_LISTS } from '../../constants';
import { Watchlist } from '../../types';

interface ManageWatchlistsModalProps {
    onClose: () => void;
}

const NewListModal: React.FC<{ onCreate: (name: string) => void; onCancel: () => void; }> = ({ onCreate, onCancel }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim());
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center animate-fade-in" onClick={onCancel}>
            <div className="bg-base p-4 rounded-lg shadow-xl w-full max-w-xs border border-overlay" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <label htmlFor="list-name" className="font-semibold text-text-primary">List name</label>
                    <input
                        ref={inputRef}
                        id="list-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-overlay border border-gray-600 rounded-md py-1.5 px-3 text-sm"
                    />
                    <div className="flex justify-end gap-2">
                        <button type="submit" className="px-4 py-1.5 bg-primary text-white font-semibold rounded-md text-sm" disabled={!name.trim()}>Create</button>
                        <button type="button" onClick={onCancel} className="px-4 py-1.5 bg-overlay text-text-secondary font-semibold rounded-md text-sm">Cancel</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

const WatchlistRow: React.FC<{
    wl: Watchlist;
    onEdit: (wl: Watchlist) => void;
    onDelete: (id: number) => void;
}> = ({ wl, onEdit, onDelete }) => {
    const { updateWatchlistName } = useWatchlist();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(wl.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (name.trim() && name.trim() !== wl.name) {
            updateWatchlistName(wl.id, name.trim());
        }
        setIsEditing(false);
    };

    return (
        <li className="flex items-center p-2 rounded-md hover:bg-overlay group text-sm">
            <span className="text-muted mr-3 w-4 text-center">{wl.id}</span>
            <div className="flex-1">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="w-full bg-base border border-primary rounded-md px-2 py-0.5 text-sm"
                    />
                ) : (
                    <span className="text-text-primary">{wl.name}</span>
                )}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsEditing(true)} className="text-muted hover:text-primary"><i className="fas fa-pencil-alt"></i></button>
                <button onClick={() => onDelete(wl.id)} className="text-muted hover:text-danger"><i className="fas fa-trash-alt"></i></button>
            </div>
        </li>
    );
};


const ManageWatchlistsModal: React.FC<ManageWatchlistsModalProps> = ({ onClose }) => {
    const { watchlists, addWatchlist, removeWatchlist, setActiveView } = useWatchlist();
    const [activeTab, setActiveTab] = useState<'my-lists' | 'discover'>('my-lists');
    const [isCreating, setIsCreating] = useState(false);
    
    const favoriteLists = watchlists.filter(w => w.id <= 7);
    const otherLists = watchlists.filter(w => w.id > 7);

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-2xl w-full max-w-sm h-[70vh] flex flex-col border border-overlay animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-overlay">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>
                        <input type="text" placeholder="Search lists" className="w-full bg-base border border-gray-600 rounded-md py-1.5 pl-9 pr-24 text-sm" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted border border-gray-600 rounded px-1.5 py-0.5">Ctrl+Shift+K</div>
                    </div>
                </div>

                <div className="border-b border-overlay px-4 flex justify-between items-center">
                    <nav className="flex gap-4">
                        <button onClick={() => setActiveTab('my-lists')} className={`py-2 text-sm font-semibold border-b-2 ${activeTab === 'my-lists' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}>My lists</button>
                        <button onClick={() => setActiveTab('discover')} className={`py-2 text-sm font-semibold border-b-2 ${activeTab === 'discover' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}>Discover</button>
                    </nav>
                     {activeTab === 'my-lists' && <button onClick={() => setIsCreating(true)} className="text-primary font-semibold text-sm hover:underline">+ New list</button>}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {activeTab === 'my-lists' && (
                        <div>
                            <h4 className="text-xs uppercase text-muted font-bold p-2 mt-2">FAVORITES</h4>
                            <ul>
                                {favoriteLists.map(wl => (
                                    <WatchlistRow key={wl.id} wl={wl} onEdit={() => {}} onDelete={removeWatchlist} />
                                ))}
                            </ul>

                             {otherLists.length > 0 && 
                                <>
                                    <h4 className="text-xs uppercase text-muted font-bold p-2 mt-4">OTHERS</h4>
                                    <ul>
                                        {otherLists.map(wl => (
                                            <WatchlistRow key={wl.id} wl={wl} onEdit={() => {}} onDelete={removeWatchlist} />
                                        ))}
                                    </ul>
                                </>
                             }
                        </div>
                    )}
                    {activeTab === 'discover' && (
                        <div className="p-2">
                             <h4 className="text-xs uppercase text-muted font-bold mb-2">INDICES</h4>
                             <ul>
                                {DISCOVER_LISTS.map(list => (
                                    <li key={list.name}>
                                        <button 
                                            onClick={() => { setActiveView({ type: 'discover', list }); onClose(); }} 
                                            className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-overlay group text-sm"
                                        >
                                            <i className="fas fa-layer-group text-muted group-hover:text-primary"></i>
                                            <span className="text-text-primary">{list.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {isCreating && <NewListModal onCreate={(name) => {addWatchlist(name); setIsCreating(false);}} onCancel={() => setIsCreating(false)} />}
        </>
    );
};

export default ManageWatchlistsModal;