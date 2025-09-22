import React, { useState, useEffect, useMemo } from 'react';
import type { User, SyllabusCoverage } from '../types';
import { Role, Branch } from '../types';
import { getAllSyllabusCoverage, updateSyllabusCoverage as apiUpdateSyllabusCoverage } from '../services';
import { Icons } from '../constants';
import { Modal } from '../components';

// Quick Syllabus Update Component
const QuickSyllabusUpdate: React.FC<{
    subjects: SyllabusCoverage[];
    onSave: (id: string, updates: { topicsCompleted?: number, totalTopics?: number }) => Promise<void>;
}> = ({ subjects, onSave }) => {
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [completed, setCompleted] = useState<string>('');
    const [total, setTotal] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);

    useEffect(() => {
        if (selectedSubject) {
            setCompleted(String(selectedSubject.topicsCompleted));
            setTotal(String(selectedSubject.totalTopics));
        } else {
            setCompleted('');
            setTotal('');
        }
    }, [selectedSubject]);

    const handleSave = async () => {
        if (!selectedSubject) return;
        setIsSaving(true);
        await onSave(selectedSubject.id, {
            topicsCompleted: parseInt(completed, 10),
            totalTopics: parseInt(total, 10),
        });
        setIsSaving(false);
        setSelectedSubjectId(''); // Reset form after saving
    };
    
    const numCompleted = parseInt(completed, 10) || 0;
    const numTotal = parseInt(total, 10) || 1; // Avoid division by zero
    const percentage = Math.round((numCompleted / numTotal) * 100);

    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700/50 mb-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Icons.sparkles className="w-6 h-6 text-accent-400" />
                Quick Syllabus Update
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Select Subject</label>
                    <select
                        value={selectedSubjectId}
                        onChange={e => setSelectedSubjectId(e.target.value)}
                        className="w-full p-3 bg-slate-700/80 rounded-lg border-2 border-slate-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                        <option value="">-- Choose a subject --</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.subjectCode} - {s.subjectName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-4 col-span-1">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Topics Completed</label>
                        <input
                            type="number"
                            value={completed}
                            onChange={e => setCompleted(e.target.value)}
                            disabled={!selectedSubjectId}
                            min="0"
                            max={numTotal}
                            className="w-full p-3 bg-slate-700/80 rounded-lg border-2 border-slate-600 focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:bg-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Total Topics</label>
                        <input
                            type="number"
                            value={total}
                            onChange={e => setTotal(e.target.value)}
                            disabled={!selectedSubjectId}
                            min="1"
                            className="w-full p-3 bg-slate-700/80 rounded-lg border-2 border-slate-600 focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:bg-slate-800"
                        />
                    </div>
                </div>
                <div className="md:col-span-1">
                     <button
                        onClick={handleSave}
                        disabled={!selectedSubjectId || isSaving}
                        className="w-full font-semibold py-3 px-6 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Update'}
                    </button>
                </div>
            </div>
            {selectedSubjectId && (
                <div className="mt-4">
                    <div className="relative h-3 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="bg-green-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-right text-sm font-semibold mt-1 text-slate-300">{percentage}% Complete</p>
                </div>
            )}
        </div>
    );
};


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


// Main Page Component
const SyllabusPage: React.FC<{ user: User }> = ({ user }) => {
    const [allCoverage, setAllCoverage] = useState<SyllabusCoverage[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSubject, setEditingSubject] = useState<SyllabusCoverage | null>(null);
    
    const fetchAllData = () => {
        setLoading(true);
        getAllSyllabusCoverage()
            .then(setAllCoverage)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const isFacultyOrAdmin = user.role === Role.PRINCIPAL || user.role === Role.FACULTY || user.role === Role.HOD;

    const editableSubjects = useMemo(() => {
        if (!isFacultyOrAdmin) return [];
        if (user.role === Role.PRINCIPAL) return allCoverage;
        if (user.role === Role.HOD) return allCoverage.filter(s => s.branch === user.branch);
        return allCoverage.filter(s => s.facultyId === user.id);
    }, [allCoverage, user, isFacultyOrAdmin]);
    
    const filteredCoverage = useMemo(() => {
        if (!user) return [];
        switch (user.role) {
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
        await apiUpdateSyllabusCoverage(id, updates);
        fetchAllData(); // Refetch all data to show updated progress
    };


    const SubjectCard = ({ subject }: { subject: SyllabusCoverage }) => {
        const percentage = subject.totalTopics > 0 ? Math.round((subject.topicsCompleted / subject.totalTopics) * 100) : 0;
        const canEdit = isFacultyOrAdmin && (user.id === subject.facultyId || user.role === Role.PRINCIPAL || (user.role === Role.HOD && user.branch === subject.branch));
        
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
                <button onClick={() => setEditingSubject(subject)} className="w-full text-left group">
                    {content}
                </button>
            );
        }
        return <div>{content}</div>;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3">
                    <Icons.syllabus className="w-9 h-9" />
                    Syllabus Progress Tracker
                </h1>
                <p className="text-lg text-slate-400 mt-2">
                    {user.role === Role.PRINCIPAL ? 'Viewing syllabus progress for all departments.' : 'Viewing syllabus progress for your assigned subjects.'}
                </p>
            </div>

            {isFacultyOrAdmin && editableSubjects.length > 0 && (
                <QuickSyllabusUpdate subjects={editableSubjects} onSave={handleSaveProgress} />
            )}

            {loading ? <p className="text-center py-10 text-slate-400">Loading syllabus data...</p> : (
                <div className="space-y-12">
                    {Object.keys(groupedByBranch).length > 0 ? Object.entries(groupedByBranch).map(([branch, subjects]) => (
                         <div key={branch} className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700/50 animate-fade-in">
                            <h2 className="text-2xl font-bold text-slate-300 mb-2">Department: {branch}</h2>
                            <div className="space-y-1">
                                {subjects.map(subject => <SubjectCard key={subject.id} subject={subject} />)}
                            </div>
                        </div>
                    )) : (
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