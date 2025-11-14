import React, { useState, useMemo } from 'react';
import type { User, SBTETResult } from '../types';
import { getAllSbtetResultsForPin, getUserByPin } from '../services';
import { Icons } from '../constants';

const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition";
const buttonClasses = "font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:transform-none disabled:shadow-none";

const SummaryStatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 rounded-lg">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);


const SBTETResultChecker: React.FC = () => {
    const [pin, setPin] = useState('');
    const [results, setResults] = useState<SBTETResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchedUser, setSearchedUser] = useState<User | null>(null);

    const summary = useMemo(() => {
        if (!results || results.length === 0) return null;

        const totalSgpa = results.reduce((sum, r) => sum + r.sgpa, 0);
        const totalCredits = results.reduce((sum, r) => sum + r.creditsEarned, 0);
        const totalBacklogs = results.reduce((sum, r) => {
            const failedSubjects = r.subjects.filter(s => s.total < 35).length;
            return sum + failedSubjects;
        }, 0);
        const cgpa = totalSgpa / results.length;

        return {
            cgpa: cgpa.toFixed(2),
            totalCredits,
            backlogs: totalBacklogs,
        }
    }, [results]);

    const handleCheck = async () => {
        if (!pin) return;
        setIsLoading(true);
        setError('');
        setResults(null);
        setSearchedUser(null);
        
        try {
            const student = await getUserByPin(pin, null);
            if (!student) {
                setError('Student with this PIN not found.');
                setIsLoading(false);
                return;
            }
            setSearchedUser(student);

            const data = await getAllSbtetResultsForPin(pin, null);
            if (data && data.length > 0) {
                setResults(data);
            } else {
                setError(`No SBTET results found for PIN ${pin}.`);
            }
        } catch (err) {
            setError('Failed to fetch results. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={pin}
                    onChange={e => setPin(e.target.value.toUpperCase())}
                    placeholder="Enter your PIN"
                    className={`${inputClasses} mt-0 flex-grow`}
                />
                <button onClick={handleCheck} disabled={!pin || isLoading} className={`${buttonClasses} !shadow-md`}>
                    {isLoading ? 'Checking...' : 'Check'}
                </button>
            </div>

            {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}
            
            {results && searchedUser && summary && (
                 <div className="space-y-4 mt-6 animate-fade-in">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{searchedUser.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{searchedUser.pin}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryStatCard title="Overall CGPA" value={summary.cgpa} icon={Icons.reports} />
                        <SummaryStatCard title="Total Credits" value={summary.totalCredits} icon={Icons.checkCircle} />
                        <SummaryStatCard title="Backlogs" value={summary.backlogs} icon={Icons.xCircle} />
                    </div>
                 </div>
            )}
        </div>
    );
};

export default SBTETResultChecker;
