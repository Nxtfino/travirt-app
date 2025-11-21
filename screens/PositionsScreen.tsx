
import React from 'react';

const PositionsScreen: React.FC = () => {
    return (
        <main className="animate-fade-in p-6">
             <h2 className="text-3xl font-bold text-text-primary mb-6">Positions</h2>
             <div className="bg-surface rounded-lg shadow-lg p-12 text-center text-muted">
                <i className="fas fa-chart-pie text-4xl mb-4"></i>
                <h3 className="text-xl font-semibold text-text-primary">Today's Positions</h3>
                <p>This section is under construction. Your open positions for the day will appear here.</p>
             </div>
        </main>
    );
};

export default PositionsScreen;