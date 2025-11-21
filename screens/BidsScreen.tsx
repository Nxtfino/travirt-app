
import React from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';

const mockTasks = [
    { id: 'task1', title: 'Complete Your Profile', description: 'Fill out your profile details to help us customize your experience.', reward: 5, status: 'available' },
    { id: 'task2', title: 'Watch a Tutorial Video', description: 'Learn the basics of our platform by watching our introductory video.', reward: 10, status: 'available' },
    { id: 'task3', title: 'Execute Your First 10 Trades', description: 'Get hands-on experience by placing your first ten trades on any instrument.', reward: 20, status: 'inprogress' },
    { id: 'task4', title: 'Refer a Friend', description: 'Invite a friend to join TraVirt and earn rewards when they sign up.', reward: 50, status: 'available' },
    { id: 'task5', title: 'Daily Login Bonus', description: 'Log in every day to claim your daily reward and keep your streak going.', reward: 10, status: 'available' },
    { id: 'task6', title: 'Follow us on Social Media', description: 'Stay updated with the latest news and features by following our social channels.', reward: 5, status: 'available' },
];


const BidsScreen: React.FC = () => {
    const { claimDailyBonus, portfolio } = usePortfolio();

    const handleTaskAction = (task: typeof mockTasks[0]) => {
        if (task.id === 'task5') {
            if (claimDailyBonus()) {
                alert('10 NXO daily bonus claimed!');
                // In a real app, you'd update the task state here to 'completed'
            }
        } else {
            alert(`Starting task: ${task.title}`);
        }
    };

    const getButtonForTask = (task: typeof mockTasks[0]) => {
        // Special handling for daily bonus
        if (task.id === 'task5') {
            if (portfolio.dailyBonusClaimed) {
                return <button className="border border-gray-600 text-muted font-semibold py-2 px-6 rounded-md text-sm cursor-not-allowed" disabled>Claimed</button>;
            } else {
                return <button onClick={() => handleTaskAction(task)} className="bg-primary hover:bg-primary-focus text-white font-semibold py-2 px-6 rounded-md text-sm transition-colors">Claim</button>;
            }
        }
        
        switch (task.status) {
            case 'available':
                return <button onClick={() => handleTaskAction(task)} className="bg-primary hover:bg-primary-focus text-white font-semibold py-2 px-6 rounded-md text-sm transition-colors">Start</button>;
            case 'inprogress':
                 return <button className="bg-yellow-500 text-yellow-900 font-semibold py-2 px-6 rounded-md text-sm cursor-not-allowed">In Progress</button>;
            case 'completed':
                return <button className="border border-gray-600 text-muted font-semibold py-2 px-6 rounded-md text-sm cursor-not-allowed" disabled>Completed</button>;
            default:
                return null;
        }
    }

    return (
        <main className="animate-fade-in text-text-primary p-6">
             <header className="mb-8">
                <h1 className="text-4xl font-bold flex items-center gap-4"><i className="fas fa-coins text-yellow-400"></i>Earn NXO Tokens</h1>
                <p className="text-muted mt-2">Complete tasks to earn NFINO (NXO) tokens, which can be converted into virtual trading balance.</p>
            </header>
            
            <div className="space-y-4">
                {mockTasks.map(task => (
                    <div key={task.id} className="bg-surface rounded-lg shadow-lg p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`text-2xl w-12 h-12 flex items-center justify-center rounded-lg ${task.status === 'completed' || (task.id === 'task5' && portfolio.dailyBonusClaimed) ? 'bg-overlay text-muted' : 'bg-primary text-white'}`}>
                                {task.status === 'completed' || (task.id === 'task5' && portfolio.dailyBonusClaimed) ? <i className="fas fa-check"></i> : <i className="fas fa-star"></i>}
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${task.status === 'completed' ? 'text-muted line-through' : 'text-text-primary'}`}>{task.title}</h3>
                                <p className="text-sm text-muted">{task.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="font-bold text-2xl text-yellow-400">+{task.reward}</p>
                                <p className="text-xs text-muted">NXO</p>
                            </div>
                            <div className="w-32 text-right">
                                 {getButtonForTask(task)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default BidsScreen;