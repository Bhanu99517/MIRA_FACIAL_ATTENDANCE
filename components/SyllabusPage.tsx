import React, { useState, useEffect } from 'react';
// FIX: Import Branch as a value to use it in runtime logic, and alias the imported setSyllabus function to avoid name collision.
import type { User, Syllabus } from '../types';
import { Role, Branch } from '../types';
import { getSyllabus, setSyllabus as apiSetSyllabus } from '../services';
import { Icons } from '../constants';

const SyllabusPage: React.FC<{ user: User }> = ({ user }) => {
    // FIX: Safely initialize branch state by checking if user.branch is a valid Branch enum member.
    const [branch, setBranch] = useState<Branch>(Object.values(Branch).find(b => b === user.branch) || Branch.EC);
    const [year, setYear] = useState(user.year || 1);
    const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
    const [loading, setLoading] = useState(true);
    
    const isAdmin = user.role === Role.PRINCIPAL || user.role === Role.FACULTY || user.role === Role.HOD;
    
    useEffect(() => {
        setLoading(true);
        getSyllabus(branch, year)
            .then(setSyllabus)
            .finally(() => setLoading(false));
    }, [branch, year]);

    const handleUpdateSyllabus = async () => {
        const url = prompt("Enter the new URL for the syllabus PDF:", syllabus?.url || '');
        if (url) {
            setLoading(true);
            // FIX: Use the aliased apiSetSyllabus function to avoid conflict with the state setter.
            await apiSetSyllabus(branch, year, url, user.name);
            const updatedSyllabus = await getSyllabus(branch, year);
            setSyllabus(updatedSyllabus);
            setLoading(false);
            alert("Syllabus updated successfully!");
        }
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
             <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Icons.syllabus className="w-8 h-8 text-primary-500" />
                Syllabus
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">View and download the official syllabus for each branch and year.</p>

            {isAdmin && (
                <div className="mt-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4 flex-wrap">
                    <div>
                        <label className="text-sm font-medium">Branch</label>
                        <select value={branch} onChange={e => setBranch(e.target.value as Branch)} className="mt-1 p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500">
                           <option value="CS">CS</option>
                           <option value="EC">EC</option>
                           <option value="CE">CE</option>
                           <option value="EEE">EEE</option>
                           <option value="MECH">MECH</option>
                           <option value="IT">IT</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Year</label>
                        <select value={year} onChange={e => setYear(Number(e.target.value))} className="mt-1 p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500">
                           <option value={1}>1st Year</option>
                           <option value={2}>2nd Year</option>
                           <option value={3}>3rd Year</option>
                        </select>
                    </div>
                </div>
            )}
            
            <div className="mt-8 flex justify-center">
                 {loading ? <p>Loading syllabus...</p> : syllabus ? (
                     <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center animate-fade-in">
                         <div className="mx-auto p-3 inline-block bg-primary-100 dark:bg-primary-900/50 rounded-full">
                            <Icons.applications className="w-10 h-10 text-primary-600 dark:text-primary-300" />
                         </div>
                         <h2 className="mt-4 text-2xl font-bold">Syllabus for {syllabus.branch} - {syllabus.year}{year === 1 ? 'st' : year === 2 ? 'nd' : 'rd'} Year</h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Last updated by {syllabus.updated_by} on {new Date(syllabus.updated_at).toLocaleDateString()}</p>
                         
                         <a href={syllabus.url} target="_blank" rel="noopener noreferrer" className="mt-6 font-semibold py-3 px-8 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 inline-flex items-center gap-2">
                            <Icons.download className="w-5 h-5"/> View / Download PDF
                         </a>

                         {isAdmin && (
                            <div className="mt-6 border-t dark:border-slate-700 pt-4">
                                <button onClick={handleUpdateSyllabus} className="text-sm font-semibold text-accent-600 dark:text-accent-400 hover:underline">
                                    Update Syllabus URL
                                </button>
                            </div>
                         )}
                     </div>
                 ) : (
                     <div className="text-center py-10">
                         <p className="font-semibold">No syllabus found for {branch} - Year {year}.</p>
                         {isAdmin && <button onClick={handleUpdateSyllabus} className="mt-4 font-semibold py-2 px-4 rounded-lg bg-primary-600 text-white">Upload Now</button>}
                     </div>
                 )}
            </div>
        </div>
    );
};

export default SyllabusPage;