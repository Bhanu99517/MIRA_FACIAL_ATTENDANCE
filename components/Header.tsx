import React from 'react';
import { useAppContext } from '../App';
import { Icons } from '../constants';
import { Role } from '../types';

const Header: React.FC = () => {
  const { theme, toggleTheme, user, setSidebarOpen, setPage } = useAppContext();

  return (
    <header className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg z-20 border-b border-slate-200 dark:border-slate-700 animate-fade-in-down">
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                 <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 dark:text-slate-400">
                    <Icons.menu className="h-6 w-6"/>
                </button>
                <div className="flex-1 ml-4 md:ml-0">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white glitch">Welcome, {user?.name.split(' ')[0]}!</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.role === Role.SUPER_ADMIN ? "System Interface Engaged. Standby for Directives." : "Let's manage attendance efficiently."}</p>
                </div>

                <div className="flex items-center space-x-4">
                    {user?.role !== Role.SUPER_ADMIN && (
                        <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            {theme === 'light' ? <Icons.moon className="h-6 w-6" /> : <Icons.sun className="h-6 w-6" />}
                        </button>
                    )}

                    <button 
                        onClick={() => setPage('Settings')}
                        title="Go to settings"
                        className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <img className="h-11 w-11 rounded-full object-cover ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-primary-500" src={user?.imageUrl} alt="User avatar" />
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </header>
  );
};

export default Header;