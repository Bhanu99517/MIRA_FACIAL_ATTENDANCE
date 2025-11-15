// src/components/Header.tsx

// Import React.
import React from 'react';
// Import the custom hook to access the global application context.
import { useAppContext } from '../App';
// Import the centralized Icons object.
import { Icons } from '../constants';
// Import the Role enum for type-safe role checks.
import { Role } from '../types';

// The Header component, which displays at the top of the authenticated app view.
const Header: React.FC = () => {
  // Destructure the necessary values and functions from the app context.
  const { theme, toggleTheme, user, setSidebarOpen, setPage } = useAppContext();

  return (
    // The header element is sticky to keep it visible while scrolling.
    // It has a semi-transparent background with a backdrop blur for a modern look.
    <header className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg z-20 border-b border-slate-200 dark:border-slate-700 animate-fade-in-down">
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                 {/* Hamburger menu button, only visible on smaller screens (md:hidden). */}
                 {/* It opens the sidebar when clicked. */}
                 <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 dark:text-slate-400">
                    <Icons.menu className="h-6 w-6"/>
                </button>
                {/* The main content of the header, containing the welcome message. */}
                <div className="flex-1 ml-4 md:ml-0">
                    {/* Display a welcome message, using the first name of the user. */}
                    {/* The 'glitch' class is for the Super Admin's hacker theme. */}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white glitch">Welcome, {user?.name.split(' ')[0]}!</h1>
                    {/* A subtitle that changes based on the user's role. */}
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.role === Role.SUPER_ADMIN ? "System Interface Engaged. Standby for Directives." : "Let's manage attendance efficiently."}</p>
                </div>

                {/* The right side of the header with action buttons. */}
                <div className="flex items-center space-x-4">
                    {/* Theme toggle button. It's hidden for the Super Admin, who has a fixed theme. */}
                    {user?.role !== Role.SUPER_ADMIN && (
                        <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            {/* Conditionally render the sun or moon icon based on the current theme. */}
                            {theme === 'light' ? <Icons.moon className="h-6 w-6" /> : <Icons.sun className="h-6 w-6" />}
                        </button>
                    )}

                    {/* User profile button/link. Navigates to the Settings page on click. */}
                    <button 
                        onClick={() => setPage('Settings')}
                        title="Go to settings"
                        className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        {/* User's avatar image. */}
                        <img className="h-11 w-11 rounded-full object-cover ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-primary-500" src={user?.imageUrl} alt="User avatar" />
                        {/* User's name and role, hidden on small screens (hidden sm:block). */}
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
