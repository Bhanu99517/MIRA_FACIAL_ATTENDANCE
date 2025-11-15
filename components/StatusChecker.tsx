// src/components/StatusChecker.tsx
// This component provides a simple interface for users (typically students) to check the status of their submitted applications
// by entering their Personal Identification Number (PIN). It's designed to be used on the public-facing landing page.

// Import React and the useState hook for managing component state.
import React, { useState } from 'react';
// Import type definitions for Application, ApplicationStatus, and ApplicationType.
import type { Application } from '../types';
import { ApplicationStatus, ApplicationType } from '../types';
// Import the service function to fetch applications by PIN.
import { getApplicationsByPin } from '../services';
// Import the centralized Icons object.
import { Icons } from '../constants';

// Reusable Tailwind CSS class strings for consistent styling.
const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition";
const buttonClasses = "font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:transform-none disabled:shadow-none";

// A helper function to get the appropriate CSS classes for the status "pill" based on the application status.
const getStatusChip = (status: ApplicationStatus) => {
    const baseClasses = "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    if (status === ApplicationStatus.APPROVED) return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200`;
    if (status === ApplicationStatus.REJECTED) return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200`;
    // Default style for 'Pending' status.
    return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200`;
};

// The main StatusChecker component.
const StatusChecker: React.FC = () => {
    // State to hold the user-entered PIN.
    const [pin, setPin] = useState('');
    // State to store the fetched application results.
    const [results, setResults] = useState<Application[]>([]);
    // State to track if data is currently being fetched.
    const [isLoading, setIsLoading] = useState(false);

    // Function to handle the "Check Status" button click.
    const handleCheckStatus = async () => {
        if (!pin) return; // Do nothing if PIN is empty.
        setIsLoading(true);
        // Call the service to get applications for the given PIN.
        const apps = await getApplicationsByPin(pin);
        setResults(apps);
        setIsLoading(false);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Input and button for submitting the PIN. */}
            <div className="flex gap-2">
                <input type="text" value={pin} onChange={e => setPin(e.target.value.toUpperCase())} placeholder="Enter PIN to check status" className={`${inputClasses} mt-0 flex-grow`}/>
                <button onClick={handleCheckStatus} disabled={!pin || isLoading} className={`${buttonClasses} !shadow-md`}>
                    {isLoading ? 'Checking...' : 'Check Status'}
                </button>
            </div>
            {/* Conditionally render the results list if there are any applications found. */}
            {results.length > 0 && (
                 <div className="mt-6 animate-fade-in">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">Results for {pin}:</h4>
                    <ul className="space-y-3 mt-2">
                    {/* Map over the results array to display each application. */}
                    {results.map(app => (
                        <li key={app.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                           <div className="flex-grow">
                                <p className="font-semibold text-slate-900 dark:text-white">{app.payload.subject || app.type}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{app.payload.reason || app.payload.purpose}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                           </div>
                           <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                {/* Display the status chip. */}
                                <span className={getStatusChip(app.status)}>{app.status}</span>
                                {/* Conditionally show a "Download PDF" button for approved certificates. */}
                                {app.status === ApplicationStatus.APPROVED && (app.type === ApplicationType.BONAFIDE || app.type === ApplicationType.TC) && (
                                    <button onClick={() => alert(`Downloading ${app.type} PDF...`)} className="flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                        <Icons.download className="w-4 h-4" /> Download PDF
                                    </button>
                                )}
                           </div>
                        </li>
                    ))}
                </ul>
                </div>
            )}
        </div>
    );
};

export default StatusChecker;
