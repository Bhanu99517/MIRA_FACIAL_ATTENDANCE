import React, { useState } from 'react';
import { getAttendanceForUserByPin } from '../services';

const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition";
const buttonClasses = "font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:transform-none disabled:shadow-none";

interface AttendanceResult {
    percentage: number;
    present: number;
    total: number;
}

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
                className="text-slate-300 dark:text-slate-700"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
            />
            <circle
                className="text-primary-500"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
             <text
                x="60"
                y="60"
                className="text-2xl font-bold fill-current text-slate-700 dark:text-slate-200"
                textAnchor="middle"
                dominantBaseline="middle"
                transform="rotate(90 60 60)"
            >
                {`${percentage}%`}
            </text>
        </svg>
    );
};

const AttendancePercentageChecker: React.FC = () => {
    const [pin, setPin] = useState('');
    const [result, setResult] = useState<AttendanceResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheck = async () => {
        if (!pin) return;
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const records = await getAttendanceForUserByPin(pin);
            if (records.length === 0) {
                setError('No attendance records found for this PIN, or the PIN is invalid.');
            } else {
                const present = records.filter(r => r.status === 'Present').length;
                const total = records.length;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                setResult({ percentage, present, total });
            }
        } catch (e) {
            setError('An error occurred while fetching data.');
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

            {result && (
                <div className="text-center mt-6 animate-fade-in-up">
                    <div className="flex justify-center">
                         <CircularProgress percentage={result.percentage} />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Overall Attendance: {result.percentage}%</p>
                    <p className="text-slate-500 dark:text-slate-400">You were present for <span className="font-bold text-slate-700 dark:text-slate-200">{result.present}</span> out of <span className="font-bold text-slate-700 dark:text-slate-200">{result.total}</span> working days.</p>
                </div>
            )}
        </div>
    );
};

export default AttendancePercentageChecker;
