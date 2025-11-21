
import React, { useState } from 'react';
import WebLoginScreen from './WebLoginScreen';
import WebTfaScreen from './WebTfaScreen';

interface WebAuthScreenProps {
    onLoginSuccess: (userId: string) => void;
}

const WebAuthScreen: React.FC<WebAuthScreenProps> = ({ onLoginSuccess }) => {
    const [view, setView] = useState<'login' | 'tfa'>('login');
    const [userId, setUserId] = useState('');

    const handleLogin = (id: string) => {
        setUserId(id);
        setView('tfa');
    };

    const handleTfaVerify = () => {
        onLoginSuccess(userId);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-base p-4 font-sans text-text-primary">
            {view === 'login' && (
                <WebLoginScreen onLogin={handleLogin} />
            )}
            {view === 'tfa' && (
                <WebTfaScreen userId={userId} onVerify={handleTfaVerify} onBack={() => setView('login')} />
            )}
        </div>
    );
};

export default WebAuthScreen;