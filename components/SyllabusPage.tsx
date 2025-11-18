

import React, { useState, useEffect, useMemo } from 'react';
import type { User, SyllabusCoverage } from '../types';
import { Role, Branch } from '../types';
import { getAllSyllabusCoverage, updateSyllabusCoverage as apiUpdateSyllabusCoverage } from '../services';
import { Icons } from '../constants';
import { Modal } from './components.tsx';

// Progress Update Modal Component
const UpdateProgressModal: React.FC<{
    subject: SyllabusCoverage;
    onClose: () => void;
    onSave: (id: string, updates: { topicsCompleted: number, totalTopics: number }) => Promise<void>;
}> = ({ subject, onClose, onSave }) => {
    const [completed, setCompleted] = useState(subject.topicsCompleted);
    const [total, setTotal] = useState(subject.totalTopics);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(subject.id, { topicsCompleted: completed, totalTopics: total });
        setIsSaving(false);
        onClose();
    };

    useEffect(() => {
        if (completed > total) {
            setCompleted(total);
        }
    }, [total, completed]);

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <Modal isOpen={true} onClose={onClose} title={`Update: ${subject.subjectName}`}>
            <div className="space-y-6">
                 <p className="text-sm text-slate-500 dark:text-slate-400">Adjust the syllabus progress and total topic count for this subject.</p>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Topics Completed</label>
                        <input
                            type="number"
                            min="0"
                            max={total}
                            value={completed}
                            onChange={(e) => setCompleted(Number(e.target.value))}
                            className="mt-1 w-full p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border-2 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Total Topics</label>
                        <input
                            type="number"
                            min={1}
                            value={total}
                            onChange={(e) => setTotal(Number(e.target.value))}
                            className="mt-1 w-full p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border-2 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-baseline">
                        <label className="text-lg font-bold text-slate-900 dark:text-white">{completed}</label>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ {total} Topics</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={total}
                        value={completed}
                        onChange={(e) => setCompleted(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 mt-2"
                    />
                </div>
                
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Completion Percentage</p>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{percentage}%</p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {isSaving ? 'Saving...' : 'Save Progress'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// FIX: Moved SubjectCard outside of SyllabusPage to prevent re-creation on every render,
// which is a React anti-pattern and can cause type errors. Passed necessary props instead.
const SubjectCard: React.FC<{ 
    subject: SyllabusCoverage, 
    user: User, 
    isFacultyOrAdmin: boolean,
    onEdit: (subject: SyllabusCoverage) => void 
}> = ({ subject, user, isFacultyOrAdmin, onEdit }) => {
    const percentage = subject.totalTopics > 0 ? Math.round((subject.topicsCompleted / subject.totalTopics) * 100) : 0;
    const canEdit = isFacultyOrAdmin && (user.role === Role.SUPER_ADMIN || user.id === subject.facultyId || (user.role === Role.HOD && user.branch === subject.branch));
    
    const progressBarColor = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';

    const content = (
        <div className="border-b border-slate-700/50 py-4 last:border-b-0 group-hover:bg-slate-800/50 px-4 -mx-4 rounded-md transition-colors">
            <h3 className="text-lg font-semibold text-slate-200">{subject.subjectCode} {subject.subjectName}</h3>
            <p className="text-sm text-slate-400 mt-1">Faculty: {subject.facultyName}</p>
            <div className="mt-4">
                <div className="relative h-6 w-full bg-slate-700/80 rounded-full overflow-hidden">
                    <div 
                        className={`${progressBarColor} h-full rounded-full transition-all duration-500`} 
                        style={{ width: `${percentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
                        {subject.topicsCompleted} / {subject.totalTopics} ({percentage}%)
                    </span>
                </div>
            </div>
        </div>
    );

    if (canEdit) {
        return (
            <button onClick={() => onEdit(subject)} className="w-full text-left group">
                {content}
            </button>
        );
    }
    return <div>{content}</div>;
};

// Main Page Component
const SyllabusPage: React.FC<{ user: User }> = ({ user }) => {
    const [allCoverage, setAllCoverage] = useState<SyllabusCoverage[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSubject, setEditingSubject] = useState<SyllabusCoverage | null>(null);
    
    const fetchAllData = () => {
        setLoading(true);
        // FIX: Pass the 'user' object to the service call as required.
        getAllSyllabusCoverage(user)
            .then(setAllCoverage)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const isFacultyOrAdmin = user.role === Role.PRINCIPAL || user.role === Role.FACULTY || user.role === Role.HOD || user.role === Role.SUPER_ADMIN;

    const filteredCoverage = useMemo(() => {
        if (!user) return [];
        switch (user.role) {
            case Role.SUPER_ADMIN:
            case Role.PRINCIPAL:
                return allCoverage;
            case Role.HOD:
                return allCoverage.filter(s => s.branch === user.branch);
            case Role.FACULTY:
                return allCoverage.filter(s => s.facultyId === user.id);
            default: // Students, Staff etc. can see their branch's subjects if they have access
                return allCoverage.filter(s => s.branch === user.branch);
        }
    }, [allCoverage, user]);

    const groupedByBranch = useMemo(() => {
        return filteredCoverage.reduce((acc, subject) => {
            (acc[subject.branch] = acc[subject.branch] || []).push(subject);
            return acc;
        }, {} as Record<string, SyllabusCoverage[]>);
    }, [filteredCoverage]);

    const handleSaveProgress = async (id: string, updates: { topicsCompleted?: number, totalTopics?: number }) => {
        // FIX: Pass the 'user' object to the service call as required.
        await apiUpdateSyllabusCoverage(id, updates, user);
        fetchAllData(); // Refetch all data to show updated progress
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3">
                    <Icons.syllabus className="w-9 h-9" />
                    Syllabus Progress Tracker
                </h1>
                <p className="text-lg text-slate-400 mt-2">
                    {user.role === Role.PRINCIPAL || user.role === Role.SUPER_ADMIN ? 'Viewing syllabus progress for all departments.' : 'Viewing syllabus progress for your assigned subjects.'}
                </p>
            </div>

            {loading ? <p className="text-center py-10 text-slate-400">Loading syllabus data...</p> : (
                <div className="space-y-12">
                    {Object.keys(groupedByBranch).length > 0 ? Object.keys(groupedByBranch).map((branch) => {
                        const subjects = groupedByBranch[branch];
                        return (
                         <div key={branch} className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700/50 animate-fade-in">
                            <h2 className="text-2xl font-bold text-slate-300 mb-2">Department: {branch}</h2>
                            <div className="space-y-1">
                                {subjects.map(subject => <SubjectCard key={subject.id} subject={subject} user={user} isFacultyOrAdmin={isFacultyOrAdmin} onEdit={setEditingSubject} />)}
                            </div>
                        </div>
                    )}) : (
                        <div className="text-center py-16 bg-slate-800/50 rounded-2xl">
                            <p className="font-semibold text-lg text-slate-300">No syllabus information to display.</p>
                            <p className="text-slate-400 mt-2">There may be no subjects assigned to you or your department.</p>
                        </div>
                    )}
                </div>
            )}

            {editingSubject && (
                <UpdateProgressModal 
                    subject={editingSubject}
                    onClose={() => setEditingSubject(null)}
                    onSave={handleSaveProgress}
                />
            )}
        </div>
    );
};

export default SyllabusPage;