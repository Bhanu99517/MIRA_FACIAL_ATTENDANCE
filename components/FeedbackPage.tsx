
import React, { useState, useEffect, useMemo } from 'react';
import type { User, Feedback } from '../types';
import { Role } from '../types';
import { getFeedback, submitFeedback, updateFeedbackStatus } from '../services';
import { Icons } from '../constants';

const FeedbackCard: React.FC<{ feedback: Feedback, onStatusChange: (id: string, status: Feedback['status']) => void, isAdmin: boolean }> = ({ feedback, onStatusChange, isAdmin }) => {
    const getStatusChip = (status: Feedback['status']) => {
        const base = "px-2 py-0.5 text-xs font-semibold rounded-full";
        if (status === 'Resolved') return `${base} bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300`;
        if (status === 'In Progress') return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300`;
        return `${base} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300`;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700">
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 px-2 py-1 rounded-md">{feedback.type}</span>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feedback.message}</p>
                </div>
                {isAdmin ? (
                     <select 
                        value={feedback.status} 
                        onChange={(e) => onStatusChange(feedback.id, e.target.value as Feedback['status'])}
                        className="text-xs p-1 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-primary-500"
                    >
                        <option>New</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                    </select>
                ) : (
                    <span className={getStatusChip(feedback.status)}>{feedback.status}</span>
                )}
            </div>
            <div className="mt-3 pt-3 border-t dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                <span>
                    From: {feedback.is_anonymous ? 'Anonymous' : `${feedback.userName} (${feedback.userRole})`}
                </span>
                <span>{new Date(feedback.submitted_at).toLocaleString()}</span>
            </div>
        </div>
    );
};

const FeedbackForm: React.FC<{ user: User, onFeedbackSubmitted: () => void }> = ({ user, onFeedbackSubmitted }) => {
    const [type, setType] = useState<'Bug' | 'Suggestion' | 'Compliment'>('Suggestion');
    const [message, setMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message) return;
        setSubmitting(true);
        await submitFeedback({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            type,
            message,
            is_anonymous: isAnonymous,
        });
        setSubmitting(false);
        setMessage('');
        setType('Suggestion');
        setIsAnonymous(false);
        alert('Thank you for your feedback!');
        onFeedbackSubmitted();
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold">Submit Feedback</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Have a suggestion or found a bug? Let us know!</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Feedback Type</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 w-full p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500">
                        <option>Suggestion</option>
                        <option>Bug</option>
                        <option>Compliment</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Message</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} required className="mt-1 w-full p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500" placeholder="Please provide as much detail as possible..."></textarea>
                </div>
                 <div className="flex items-center">
                    <input id="anonymous" type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" />
                    <label htmlFor="anonymous" className="ml-2 block text-sm">Submit Anonymously</label>
                </div>
                <button type="submit" disabled={submitting} className="w-full font-semibold py-2 px-4 rounded-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>
        </div>
    );
};

const AdminFeedbackView: React.FC<{ allFeedback: Feedback[], onStatusChange: (id: string, status: Feedback['status']) => void }> = ({ allFeedback, onStatusChange }) => {
    const [tab, setTab] = useState<Feedback['status']>('New');
    
    const filteredFeedback = allFeedback.filter(f => f.status === tab);
    
    return (
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Manage Feedback</h2>
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6">
                    {(['New', 'In Progress', 'Resolved'] as Feedback['status'][]).map(status => (
                         <button key={status} onClick={() => setTab(status)} className={`${tab === status ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                            {status}
                         </button>
                    ))}
                </nav>
            </div>
            <div className="mt-6 space-y-4">
                {filteredFeedback.length > 0 ? (
                    filteredFeedback.map(fb => <FeedbackCard key={fb.id} feedback={fb} onStatusChange={onStatusChange} isAdmin={true} />)
                ) : (
                    <p className="text-center py-8 text-slate-500">No feedback in this category.</p>
                )}
            </div>
         </div>
    );
};

const FeedbackPage: React.FC<{ user: User }> = ({ user }) => {
    const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
    
    // FIX: Pass the 'user' object to the service call as required.
    const fetchAllFeedback = () => getFeedback(user).then(setAllFeedback);

    useEffect(() => {
        fetchAllFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleStatusChange = async (id: string, status: Feedback['status']) => {
        // FIX: Pass the 'user' object to the service call as required.
        await updateFeedbackStatus(id, status, user);
        fetchAllFeedback();
    };
    
    const isAdmin = user.role === Role.PRINCIPAL || user.role === Role.SUPER_ADMIN;
    const isSuperAdmin = user.role === Role.SUPER_ADMIN;

    const feedbackForAdmin = useMemo(() => {
        if (user.role === Role.SUPER_ADMIN) {
            const allowedRoles = [Role.PRINCIPAL, Role.FACULTY, Role.STAFF];
            return allFeedback.filter(fb => allowedRoles.includes(fb.userRole));
        }
        return allFeedback;
    }, [allFeedback, user.role]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Icons.feedback className="w-8 h-8 text-primary-500" />
                Feedback & Support
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
                 {isSuperAdmin
                    ? 'Review feedback submitted by staff and faculty.'
                    : 'Help us improve the Mira Attendance system.'}
            </p>
            
            {isSuperAdmin ? (
                <div className="mt-8">
                    <AdminFeedbackView allFeedback={feedbackForAdmin} onStatusChange={handleStatusChange} />
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <FeedbackForm user={user} onFeedbackSubmitted={fetchAllFeedback} />
                    </div>
                    <div className="lg:col-span-2">
                        {isAdmin ? (
                            <AdminFeedbackView allFeedback={feedbackForAdmin} onStatusChange={handleStatusChange} />
                        ) : (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                                <h2 className="text-xl font-bold mb-4">Your Submitted Feedback</h2>
                                <div className="space-y-4">
                                    {allFeedback.filter(f => f.userId === user.id).map(fb => <FeedbackCard key={fb.id} feedback={fb} onStatusChange={()=>{}} isAdmin={false} />)}
                                    {allFeedback.filter(f => f.userId === user.id).length === 0 && <p className="text-center py-8 text-slate-500">You haven't submitted any feedback yet.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackPage;