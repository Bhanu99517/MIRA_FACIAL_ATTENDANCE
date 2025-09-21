import React, { useState, useEffect } from 'react';
import type { User, SBTETResult } from '../types';
import { Role } from '../types';
import { getSbtetResult, getUserByPin } from '../services';
import { Icons } from '../constants';

const ResultsDisplay: React.FC<{ result: SBTETResult }> = ({ result }) => {
    const isPass = result.status === 'Pass';
    return (
        <div className="mt-6 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Marks</p>
                    <p className="text-2xl font-bold">{result.totalMarks} / {result.subjects.length * 100}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">SGPA</p>
                    <p className="text-2xl font-bold">{result.sgpa.toFixed(2)}</p>
                </div>
                <div className={`${isPass ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'} p-4 rounded-lg`}>
                    <p className={`text-sm font-medium ${isPass ? 'text-green-600' : 'text-red-600'}`}>Result Status</p>
                    <p className={`text-2xl font-bold ${isPass ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{result.status}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Sub Code</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Subject Name</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Internal</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">External</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Credits</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {result.subjects.map(sub => (
                            <tr key={sub.code} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 font-mono">{sub.code}</td>
                                <td className="px-6 py-4 font-semibold">{sub.name}</td>
                                <td className="px-6 py-4 text-center">{sub.internal}</td>
                                <td className="px-6 py-4 text-center">{sub.external}</td>
                                <td className="px-6 py-4 text-center font-bold">{sub.total}</td>
                                <td className="px-6 py-4 text-center">{sub.credits}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="text-center mt-6">
                <button className="font-semibold py-2 px-6 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 flex items-center gap-2 mx-auto">
                    <Icons.download className="w-5 h-5" /> Download as PDF
                </button>
            </div>
        </div>
    );
};


const SBTETResultsPage: React.FC<{ user: User }> = ({ user }) => {
    const [pin, setPin] = useState(user.role === Role.STUDENT ? user.pin : '');
    const [semester, setSemester] = useState(1);
    const [result, setResult] = useState<SBTETResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchedUser, setSearchedUser] = useState<User | null>(user);

    const isAdmin = user.role === Role.PRINCIPAL || user.role === Role.FACULTY || user.role === Role.HOD;

    useEffect(() => {
        if (!isAdmin) {
            handleFetchResult();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [semester]);

    const handlePinSearch = async (searchPin: string) => {
        setPin(searchPin.toUpperCase());
        if (searchPin.length > 5) { // A reasonable length for a PIN
            const foundUser = await getUserByPin(searchPin.toUpperCase());
            setSearchedUser(foundUser);
             if (!foundUser) {
                setError("Student with this PIN not found.");
                setResult(null);
            } else {
                setError("");
            }
        } else {
            setSearchedUser(null);
        }
    }

    const handleFetchResult = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!pin || !searchedUser) {
             setError("Please enter a valid PIN for a student.");
             return;
        }
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const data = await getSbtetResult(pin, semester);
            if (data) {
                setResult(data);
            } else {
                setError(`No results found for PIN ${pin} for Semester ${semester}.`);
            }
        } catch (err) {
            setError("Failed to fetch results. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Icons.results className="w-8 h-8 text-primary-500" />
                SBTET Results
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">View semester-wise results and performance.</p>

            <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <form onSubmit={handleFetchResult} className="flex flex-col sm:flex-row items-end gap-4">
                    {isAdmin && (
                        <div className="flex-grow w-full">
                            <label className="block text-sm font-medium">Student PIN</label>
                            <input
                                type="text"
                                value={pin}
                                onChange={(e) => handlePinSearch(e.target.value)}
                                placeholder="Enter student PIN (e.g., 23210-EC-001)"
                                className="mt-1 w-full p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border-2 border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            {pin && <p className={`text-xs mt-1 ${searchedUser ? 'text-green-600' : 'text-red-600'}`}>{searchedUser ? `Found: ${searchedUser.name}` : 'No student found.'}</p>}
                        </div>
                    )}
                    <div className={isAdmin ? '' : 'flex-grow w-full'}>
                        <label className="block text-sm font-medium">Semester</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(Number(e.target.value))}
                            className="mt-1 w-full p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border-2 border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        >
                            {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                    </div>
                    {isAdmin && (
                        <button type="submit" disabled={loading || !searchedUser} className="font-semibold py-3 px-6 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 disabled:bg-slate-400 dark:disabled:bg-slate-600 w-full sm:w-auto">
                            {loading ? 'Fetching...' : 'Get Results'}
                        </button>
                    )}
                </form>

                {loading && <div className="text-center py-10">Loading results...</div>}
                {error && <div className="text-center py-10 text-red-500 bg-red-50 dark:bg-red-900/50 p-4 rounded-lg mt-4">{error}</div>}
                {result && <ResultsDisplay result={result} />}
            </div>
        </div>
    );
};

export default SBTETResultsPage;