// src/components/AttendancePercentageChecker.tsx
// This component provides a public-facing tool for students to quickly check their overall attendance percentage by entering their PIN.
import { useState } from "react";
import { getCurrentPosition } from "../../geolocation"; // adjust ../ if needed
import { isInsideCampus } from "../../geofence";
import { apiMarkAttendance } from "../../services";

// Import React and the useState hook.
import React, { useState } from 'react';
// Import the service function to fetch attendance records for a specific user by their PIN.
import { getAttendanceForUserByPin } from '../services';

// Reusable Tailwind CSS class strings for consistent styling across components.
const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition";
const buttonClasses = "font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:transform-none disabled:shadow-none";

// Interface to define the shape of the attendance result data.
interface AttendanceResult {
    percentage: number;
    present: number;
    total: number;
}

// A visual component to display the attendance percentage in a circular progress bar.
const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    // Define the geometry of the circle.
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    // Calculate the stroke offset to represent the percentage.
    const offset = circumference - (percentage / 100) * circumference;

    return (
        // Use an SVG to draw the circular progress bar.
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* The background circle (the gray track). */}
            <circle
                className="text-slate-300 dark:text-slate-700"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
            />
            {/* The foreground circle (the colored progress). */}
            <circle
                className="text-primary-500"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset} // This property creates the progress effect.
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} // Animate the progress change.
            />
             {/* The text in the center of the circle displaying the percentage. */}
             <text
                x="60"
                y="60"
                className="text-2xl font-bold fill-current text-slate-700 dark:text-slate-200"
                textAnchor="middle"
                dominantBaseline="middle"
                transform="rotate(90 60 60)" // Counter-rotate the text to be upright.
            >
                {`${percentage}%`}
            </text>
        </svg>
    );
};

// The main component for checking attendance percentage.
const AttendancePercentageChecker: React.FC = () => {
    // State to hold the user-entered PIN.
    const [pin, setPin] = useState('');
    // State to store the calculated attendance result.
    const [result, setResult] = useState<AttendanceResult | null>(null);
    // State to track if data is currently being fetched.
    const [isLoading, setIsLoading] = useState(false);
    // State to hold and display any errors.
    const [error, setError] = useState('');

    // Function to handle the "Check" button click.
    const handleCheck = async () => {
        if (!pin) return;
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            // Fetch all attendance records for the given PIN.
            const records = await getAttendanceForUserByPin(pin);
            if (records.length === 0) {
                // If no records are found, it might be an invalid PIN.
                setError('No attendance records found for this PIN, or the PIN is invalid.');
            } else {
                // Calculate the statistics.
                const present = records.filter(r => r.status === 'Present').length;
                const total = records.length;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                // Update the state with the result.
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
            {/* Input and button for submitting the PIN. */}
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

            {/* Display error message if any. */}
            {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}

            {/* Conditionally render the result section if data is available. */}
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
