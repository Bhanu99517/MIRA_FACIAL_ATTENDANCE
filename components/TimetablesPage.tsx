

import React, { useState, useEffect } from 'react';
import type { User, Timetable } from '../types';
import { Role, Branch } from '../types';
import { getTimetable, setTimetable as apiSetTimetable } from '../services';
import { Icons } from '../constants';
import { Modal } from './components.tsx';

const TimetablesPage: React.FC<{ user: User }> = ({ user }) => {
    const [branch, setBranch] = useState<Branch>(Object.values(Branch).find(b => b === user.branch) || Branch.EC);
    const [year, setYear] = useState(user.year || 1);
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [loading, setLoading] = useState(true);
    const [isViewerModalOpen, setViewerModalOpen] = useState(false);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const isAdmin = user.role === Role.PRINCIPAL || user.role === Role.FACULTY || user.role === Role.HOD || user.role === Role.SUPER_ADMIN;

    useEffect(() => {
        setLoading(true);
        // FIX: Pass the 'user' object to the service call as required.
        getTimetable(branch, year, user)
            .then(setTimetable)
            .finally(() => setLoading(false));
    }, [branch, year, user]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const url = reader.result as string;
            if (url) {
                setLoading(true);
                // FIX: Pass the 'user' object instead of just the user's name.
                await apiSetTimetable(branch, year, url, user);
                // FIX: Pass the 'user' object to the service call as required.
                const updatedTimetable = await getTimetable(branch, year, user);
                setTimetable(updatedTimetable);
                setLoading(false);
                setUploadModalOpen(false);
                setSelectedFile(null);
                setPreviewUrl(null);
                alert("Timetable updated successfully!");
            }
        };
        reader.readAsDataURL(selectedFile);
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
                           <option value="EEE">EEE</option>
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
                            {isAdmin && <button onClick={() => setUploadModalOpen(true)} className="font-semibold text-sm py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Update</button>}
                        </div>
                        <div className="mt-6 border-2 border-dashed dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-primary-500 transition-colors" onClick={() => setViewerModalOpen(true)}>
                            <img src={timetable.url} alt={`Timetable for ${branch} Year ${year}`} className="w-full rounded-lg" />
                        </div>
                     </div>
                 ) : (
                      <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                         <p className="font-semibold text-lg">No timetable found for {branch} - Year {year}.</p>
                         {isAdmin && <button onClick={() => setUploadModalOpen(true)} className="mt-4 font-semibold py-2 px-4 rounded-lg bg-primary-600 text-white">Upload Now</button>}
                     </div>
                 )}
            </div>

            <Modal isOpen={isViewerModalOpen} onClose={() => setViewerModalOpen(false)} title={`Timetable: ${branch} - Year ${year}`}>
                <img src={timetable?.url} alt={`Timetable for ${branch} Year ${year}`} className="w-full rounded-lg" />
            </Modal>

            <Modal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload New Timetable">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Timetable Image</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Icons.upload className="mx-auto h-12 w-12 text-slate-400" />
                                <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-900 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileSelect} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF</p>
                            </div>
                        </div>
                    </div>

                    {previewUrl && (
                        <div>
                            <p className="text-sm font-medium">Preview:</p>
                            <img src={previewUrl} alt="Timetable preview" className="mt-2 rounded-lg max-h-60 w-auto mx-auto border dark:border-slate-700" />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
                        <button onClick={handleUpload} disabled={!selectedFile || loading} className="px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TimetablesPage;