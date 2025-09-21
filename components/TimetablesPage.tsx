import React, { useState, useEffect } from 'react';
// FIX: Import Branch as a value to use it in runtime logic, and alias the imported setTimetable function to avoid name collision.
import type { User, Timetable } from '../types';
import { Role, Branch } from '../types';
import { getTimetable, setTimetable as apiSetTimetable } from '../services';
import { Icons } from '../constants';
import { Modal } from '../components';

const TimetablesPage: React.FC<{ user: User }> = ({ user }) => {
    // FIX: Safely initialize branch state by checking if user.branch is a valid Branch enum member.
    const [branch, setBranch] = useState<Branch>(Object.values(Branch).find(b => b === user.branch) || Branch.EC);
    const [year, setYear] = useState(user.year || 1);
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);

    const isAdmin = user.role === Role.PRINCIPAL || user.role === Role.FACULTY || user.role === Role.HOD;

    useEffect(() => {
        setLoading(true);
        getTimetable(branch, year)
            .then(setTimetable)
            .finally(() => setLoading(false));
    }, [branch, year]);
    
    const handleUpdateTimetable = async () => {
        const url = prompt("Enter the new URL for the timetable image:", timetable?.url || 'https://i.imgur.com/8xT1iJ7.png');
        if (url) {
            setLoading(true);
            // FIX: Use the aliased apiSetTimetable function to avoid conflict with the state setter.
            await apiSetTimetable(branch, year, url, user.name);
            const updatedTimetable = await getTimetable(branch, year);
            setTimetable(updatedTimetable);
            setLoading(false);
            alert("Timetable updated successfully!");
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Icons.timetable className="w-8 h-8 text-primary-500" />
                Timetables
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">View the class schedule for each branch and year.</p>

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

            <div className="mt-8">
                 {loading ? <p className="text-center">Loading timetable...</p> : timetable ? (
                     <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Timetable for {timetable.branch} - {timetable.year}{year === 1 ? 'st' : year === 2 ? 'nd' : 'rd'} Year</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Last updated by {timetable.updated_by} on {new Date(timetable.updated_at).toLocaleDateString()}</p>
                            </div>
                            {isAdmin && <button onClick={handleUpdateTimetable} className="font-semibold text-sm py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Update</button>}
                        </div>
                        <div className="mt-6 border-2 border-dashed dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-primary-500 transition-colors" onClick={() => setModalOpen(true)}>
                            <img src={timetable.url} alt={`Timetable for ${branch} Year ${year}`} className="w-full rounded-lg" />
                        </div>
                     </div>
                 ) : (
                      <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                         <p className="font-semibold text-lg">No timetable found for {branch} - Year {year}.</p>
                         {isAdmin && <button onClick={handleUpdateTimetable} className="mt-4 font-semibold py-2 px-4 rounded-lg bg-primary-600 text-white">Upload Now</button>}
                     </div>
                 )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={`Timetable: ${branch} - Year ${year}`}>
                <img src={timetable?.url} alt={`Timetable for ${branch} Year ${year}`} className="w-full rounded-lg" />
            </Modal>
        </div>
    );
};

export default TimetablesPage;