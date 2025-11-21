
import React, { useState } from 'react';
import Logo from '../../components/auth/Logo';

interface WebLoginScreenProps {
    onLogin: (userId: string) => void;
}

const WebLoginScreen: React.FC<WebLoginScreenProps> = ({ onLogin }) => {
    const [userId, setUserId] = useState('TRDR001');
    const [password, setPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (userId && password) {
            onLogin(userId);
        } else {
            alert('Please enter User ID and Password.');
        }
    };

    return (
        <div className="bg-surface p-8 rounded-lg shadow-lg w-full max-w-sm border border-overlay">
            <div className="text-center mb-8">
                <div className="inline-block">
                    <Logo />
                </div>
                <h1 className="text-2xl font-semibold text-text-primary mt-4">Login to TraVirt</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="User ID"
                        className="w-full px-4 py-3 bg-overlay border border-gray-600 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-4 py-3 bg-overlay border border-gray-600 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary">
                       <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                </div>
                <button
                    type="submit"
                    className="w-full bg-primary text-white font-semibold py-3 rounded-md hover:bg-primary-focus transition"
                >
                    Login
                </button>
            </form>
            <div className="text-center mt-6">
                <a href="#" className="text-sm text-primary hover:underline">Forgot user ID or password?</a>
            </div>
        </div>
    );
};

export default WebLoginScreen;