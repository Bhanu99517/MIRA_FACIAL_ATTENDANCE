import React, { useState } from 'react';
import type { Application } from '../types';
import { ApplicationStatus, ApplicationType } from '../types';
import { getApplicationsByPin } from '../services';
import { Icons } from '../constants';

const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition";
const buttonClasses = "font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:transform-none disabled:shadow-none";

const getStatusChip = (status: ApplicationStatus) => {
    const baseClasses = "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    if (status === ApplicationStatus.APPROVED) return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200`;
    if (status === ApplicationStatus.REJECTED) return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200`;
    return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200`;
};

const StatusChecker: React.FC = () => {
    const [pin, setPin] = useState('');
    const [results, setResults] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckStatus = async () => {
        if (!pin) return;
        setIsLoading(true);
        const apps = await getApplicationsByPin(pin);
        setResults(apps);
        setIsLoading(false);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2">
                <input type="text" value={pin} onChange={e => setPin(e.target.value.toUpperCase())} placeholder="Enter PIN to check status" className={`${inputClasses} mt-0 flex-grow`}/>
                <button onClick={handleCheckStatus} disabled={!pin || isLoading} className={`${buttonClasses} !shadow-md`}>
                    {isLoading ? 'Checking...' : 'Check Status'}
                </button>
            </div>
            {results.length > 0 && (
                 <div className="mt-6 animate-fade-in">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">Results for {pin}:</h4>
                    <ul className="space-y-3 mt-2">
                    {results.map(app => (
                        <li key={app.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                           <div className="flex-grow">
                                <p className="font-semibold text-slate-900 dark:text-white">{app.payload.subject || app.type}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{app.payload.reason || app.payload.purpose}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                           </div>
                           <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                <span className={getStatusChip(app.status)}>{app.status}</span>
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
