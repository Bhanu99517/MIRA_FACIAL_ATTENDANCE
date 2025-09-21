import React, { useState, useEffect } from 'react';
import type { Application, User } from '../types';
import { Role, ApplicationType, ApplicationStatus } from '../types';
import { 
    submitApplication, 
    getApplicationsByPin, 
    getApplicationsByUserId, 
    getUserByPin, 
    getApplications, 
    updateApplicationStatus, 
    sendEmail 
} from '../services';
import { Icons } from '../constants';

// --- Shared Components & Utilities ---
const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition";
const buttonClasses = "font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-primary-600/50 transform hover:-translate-y-0.5 bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:transform-none disabled:shadow-none";

const getStatusChip = (status: ApplicationStatus) => {
    const baseClasses = "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    if (status === ApplicationStatus.APPROVED) return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200`;
    if (status === ApplicationStatus.REJECTED) return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200`;
    return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200`;
};

// --- Admin View Components ---

const AdminLeaveForm: React.FC<{ onApplicationSubmitted: (app: Application) => void }> = ({ onApplicationSubmitted }) => {
    const [pin, setPin] = useState('');
    const [reason, setReason] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [imageName, setImageName] = useState('');
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPin = e.target.value.toUpperCase();
        setPin(newPin);
        if (newPin.length > 5) {
            const user = await getUserByPin(newPin);
            setFoundUser(user);
        } else {
            setFoundUser(null);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageName(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newApp = await submitApplication({
                pin,
                type: ApplicationType.LEAVE,
                payload: {
                    reason,
                    from_date: fromDate,
                    to_date: toDate,
                    image_url: imageName ? `/uploads/mock/${imageName}` : undefined,
                },
            });
            onApplicationSubmitted(newApp);
            setPin(''); setReason(''); setFoundUser(null); setFromDate(''); setToDate(''); setImageName('');
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = pin && reason && fromDate && toDate && foundUser;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-sm font-medium">Student/Faculty PIN</label>
                <input type="text" placeholder="Enter PIN to identify user" value={pin} onChange={handlePinChange} className={inputClasses} />
                {pin && <p className={`text-xs mt-1 ${foundUser ? 'text-green-600' : 'text-red-600'}`}>{foundUser ? `User Found: ${foundUser.name}` : 'No user found for this PIN.'}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">From Date</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                    <label className="block text-sm font-medium">To Date</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputClasses} required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium">Reason for Leave</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g., Family function, Medical reason" className={inputClasses} required></textarea>
            </div>
             <div>
                 <label className="block text-sm font-medium">Upload Supporting Document (Optional)</label>
                 <div className="mt-1 flex items-center gap-2">
                    <label className={`${buttonClasses} cursor-pointer inline-flex items-center gap-2 !py-2 !px-3 !font-semibold !text-sm !shadow-md`}>
                        <Icons.upload className="w-5 h-5"/>
                        <span>Choose File</span>
                        <input type="file" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {imageName && <span className="text-sm text-slate-500">{imageName}</span>}
                </div>
             </div>
            <button type="submit" disabled={!isFormValid || isSubmitting} className={`${buttonClasses} w-full !py-3`}>
                {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
        </form>
    );
};

const AdminCertificateForm: React.FC<{ onApplicationSubmitted: (app: Application) => void }> = ({ onApplicationSubmitted }) => {
    const [pin, setPin] = useState('');
    const [reason, setReason] = useState('');
    const [appType, setAppType] = useState<ApplicationType.BONAFIDE | ApplicationType.TC>(ApplicationType.BONAFIDE);
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPin = e.target.value.toUpperCase();
        setPin(newPin);
        if (newPin.length > 5) {
            const user = await getUserByPin(newPin);
            setFoundUser(user);
        } else {
            setFoundUser(null);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newApp = await submitApplication({
                pin,
                type: appType,
                payload: { reason },
            });
            onApplicationSubmitted(newApp);
            setPin(''); setReason(''); setFoundUser(null);
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = pin && reason && foundUser;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-sm font-medium">Certificate Type</label>
                <select value={appType} onChange={e => setAppType(e.target.value as any)} className={inputClasses}>
                    <option value={ApplicationType.BONAFIDE}>Bonafide Certificate</option>
                    <option value={ApplicationType.TC}>Transfer Certificate (TC)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium">Student/Faculty PIN</label>
                <input type="text" placeholder="Enter PIN to identify user" value={pin} onChange={handlePinChange} className={inputClasses} required />
                {pin && <p className={`text-xs mt-1 ${foundUser ? 'text-green-600' : 'text-red-600'}`}>{foundUser ? `User Found: ${foundUser.name}` : 'No user found for this PIN.'}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Purpose / Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g., Passport application, Higher studies" className={inputClasses} required></textarea>
            </div>
            <button type="submit" disabled={!isFormValid || isSubmitting} className={`${buttonClasses} w-full !py-3`}>
                {isSubmitting ? 'Submitting...' : `Request ${appType}`}
            </button>
        </form>
    );
};


const StatusChecker: React.FC = () => {
    const [pin, setPin] = useState('');
    const [results, setResults] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckStatus = async () => {
        if (!pin) return;
        setIsLoading(true);
        const apps = await getApplicationsByPin(pin);
        setResults(apps);
        setIsLoading(false);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2">
                <input type="text" value={pin} onChange={e => setPin(e.target.value.toUpperCase())} placeholder="Enter PIN to check status" className={`${inputClasses} mt-0 flex-grow`}/>
                <button onClick={handleCheckStatus} disabled={!pin || isLoading} className={`${buttonClasses} !shadow-md`}>
                    {isLoading ? 'Checking...' : 'Check Status'}
                </button>
            </div>
            {results.length > 0 && (
                 <div className="mt-6 animate-fade-in">
                    <h4 className="font-semibold">Results for {pin}:</h4>
                    <ul className="space-y-3 mt-2">
                    {results.map(app => (
                        <li key={app.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                           <div className="flex-grow">
                                <p className="font-semibold">{app.type} - {app.payload.reason || app.payload.purpose}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                           </div>
                           <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                <span className={getStatusChip(app.status)}>{app.status}</span>
                                {app.status === ApplicationStatus.APPROVED && (app.type === ApplicationType.BONAFIDE || app.type === ApplicationType.TC) && (
                                    <button onClick={() => alert(`Downloading ${app.type} PDF...`)} className="flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                        <Icons.download className="w-4 h-4" /> Download PDF
                                    </button>
                                )}
                           </div>
                        </li>
                    ))}
                </ul>
                </div>
            )}
        </div>
    );
};

const AdminView: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'manage' | 'leave' | 'certificate' | 'status'>(
        user.role === Role.PRINCIPAL ? 'manage' : 'leave'
    );
    const [applications, setApplications] = useState<Application[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);

    const fetchAllApplications = () => {
        setLoadingApps(true);
        getApplications().then(setApplications).finally(() => setLoadingApps(false));
    };

    useEffect(() => {
        fetchAllApplications();
    }, []);
    
    const handleApplicationSubmitted = (app: Application) => {
        alert(`Application for ${app.type} submitted successfully for PIN: ${app.pin}!`);
        fetchAllApplications();
        setActiveTab(user.role === Role.PRINCIPAL ? 'manage' : 'leave');
    };

    const handleStatusChange = async (app: Application, newStatus: ApplicationStatus.APPROVED | ApplicationStatus.REJECTED) => {
        try {
            await updateApplicationStatus(app.id, newStatus);
            
            // Send email notification to applicant
            const applicant = await getUserByPin(app.pin);
            if (applicant?.email && applicant.email_verified) {
                const subject = `Your ${app.type} Application has been ${newStatus}`;
                const body = `Dear ${applicant.name},\n\nYour application for a ${app.type} for the reason "${app.payload.reason || app.payload.purpose || 'N/A'}" has been ${newStatus}.\n\nPlease contact the office for further details if required.\n\nRegards,\nMira College Administration`;
                await sendEmail(applicant.email, subject, body);
            }
            alert(`Application ${newStatus.toLowerCase()} and notification sent.`);
            fetchAllApplications();
        } catch (error) {
            console.error("Failed to update status or send email", error);
            alert(`An error occurred: ${(error as Error).message}`);
        }
    };
    
    const pendingApplications = applications.filter(a => a.status === ApplicationStatus.PENDING);
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                     <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        Application Management
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Process and manage all student and faculty applications.</p>
                </div>
            </div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                         {user.role === Role.PRINCIPAL && (
                            <button onClick={() => setActiveTab('manage')} className={`${activeTab === 'manage' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Manage Pending <span className="ml-1.5 rounded-full bg-primary-100 dark:bg-primary-900/50 px-2 py-0.5 text-xs text-primary-600 dark:text-primary-300">{pendingApplications.length}</span>
                            </button>
                        )}
                        <button onClick={() => setActiveTab('leave')} className={`${activeTab === 'leave' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            New Leave Request
                        </button>
                        <button onClick={() => setActiveTab('certificate')} className={`${activeTab === 'certificate' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            New Certificate Request
                        </button>
                         <button onClick={() => setActiveTab('status')} className={`${activeTab === 'status' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Check Status
                        </button>
                    </nav>
                </div>
                <div>
                    {activeTab === 'manage' && user.role === Role.PRINCIPAL && (
                        <div className="animate-fade-in">
                            <h3 className="text-lg font-semibold mb-4">Pending Applications</h3>
                            {loadingApps && <p>Loading applications...</p>}
                            {!loadingApps && pendingApplications.length === 0 && <p className="text-slate-500 text-center py-8">There are no pending applications.</p>}
                            <ul className="space-y-3">
                                {pendingApplications.map(app => (
                                    <li key={app.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-semibold">{app.type} Request</p>
                                            <p className="text-sm"><span className="font-medium text-slate-500">Applicant PIN:</span> <span className="font-mono">{app.pin}</span></p>
                                            <p className="text-sm"><span className="font-medium text-slate-500">Reason:</span> {app.payload.reason || app.payload.purpose || 'N/A'}</p>
                                            <p className="text-xs text-slate-400 mt-1">Submitted: {new Date(app.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                            <button onClick={() => handleStatusChange(app, ApplicationStatus.REJECTED)} className="font-semibold py-1 px-3 rounded-md text-sm transition-colors bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">Reject</button>
                                            <button onClick={() => handleStatusChange(app, ApplicationStatus.APPROVED)} className="font-semibold py-1 px-3 rounded-md text-sm transition-colors bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900">Approve</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {activeTab === 'leave' && <AdminLeaveForm onApplicationSubmitted={handleApplicationSubmitted} />}
                    {activeTab === 'certificate' && <AdminCertificateForm onApplicationSubmitted={handleApplicationSubmitted} />}
                    {activeTab === 'status' && <StatusChecker />}
                </div>
            </div>
        </div>
    );
};

// --- Student View Components ---

const StudentView: React.FC<{ user: User }> = ({ user }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [activeTab, setActiveTab] = useState<'leave' | 'bonafide'>('leave');
    
    const fetchApplications = () => {
         getApplicationsByUserId(user.id).then(setApplications);
    }
    
    useEffect(() => {
        fetchApplications();
    }, [user]);
    
    const handleApplicationSubmitted = (app: Application) => {
        alert(`${app.type} application submitted! Your request is now pending.`);
        fetchApplications(); // Refresh list
    };
    
    const StudentLeaveForm: React.FC = () => {
        const [reason, setReason] = useState('');
        const [fromDate, setFromDate] = useState('');
        const [toDate, setToDate] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
                const newApp = await submitApplication({
                    pin: user.pin,
                    type: ApplicationType.LEAVE,
                    payload: { reason, from_date: fromDate, to_date: toDate }
                });
                handleApplicationSubmitted(newApp);
                setReason(''); setFromDate(''); setToDate('');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">From Date</label>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">To Date</label>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputClasses} required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Reason for Leave</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g., Family function" className={inputClasses} required></textarea>
                </div>
                <button type="submit" disabled={isSubmitting || !reason || !fromDate || !toDate} className={`${buttonClasses} w-full !py-3`}>
                    {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
                </button>
            </form>
        );
    };

    const StudentBonafideForm: React.FC = () => {
        const [purpose, setPurpose] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
                const newApp = await submitApplication({
                    pin: user.pin,
                    type: ApplicationType.BONAFIDE,
                    payload: { reason: purpose }
                });
                handleApplicationSubmitted(newApp);
                setPurpose('');
            } finally {
                setIsSubmitting(false);
            }
        };
        
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">Purpose for Certificate</label>
                    <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} className={inputClasses} placeholder="e.g., Passport, Bank Loan" required/>
                </div>
                <button type="submit" disabled={isSubmitting || !purpose} className={`${buttonClasses} w-full !py-3`}>
                    {isSubmitting ? 'Submitting...' : 'Request Bonafide'}
                </button>
            </form>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Icons.applications className="w-8 h-8"/> My Applications</h2>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('leave')} className={`${activeTab === 'leave' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Leave Letter
                        </button>
                        <button onClick={() => setActiveTab('bonafide')} className={`${activeTab === 'bonafide' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Bonafide Certificate
                        </button>
                    </nav>
                </div>
                
                <div className="mb-8 max-w-xl">
                     <h3 className="text-xl font-semibold mb-3">
                        {activeTab === 'leave' ? 'Submit a Leave Request' : 'Request a Bonafide Certificate'}
                    </h3>
                    {activeTab === 'leave' ? <StudentLeaveForm /> : <StudentBonafideForm />}
                </div>

                <h3 className="text-xl font-semibold mb-4">Your Past Applications</h3>
                <ul className="space-y-3">
                    {applications.filter(a => a.type === (activeTab === 'leave' ? ApplicationType.LEAVE : ApplicationType.BONAFIDE)).map(app => (
                        <li key={app.id} className="p-4 border rounded-lg flex justify-between items-center dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                           <div>
                                <p className="font-semibold">{app.payload.reason || app.payload.purpose}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                           </div>
                           <span className={getStatusChip(app.status)}>{app.status}</span>
                        </li>
                    ))}
                     {applications.filter(a => a.type === (activeTab === 'leave' ? ApplicationType.LEAVE : ApplicationType.BONAFIDE)).length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No past {activeTab} applications found.</p>
                     )}
                </ul>
            </div>
        </div>
    );
};


// --- Main Component ---
const ApplicationsPage: React.FC<{ user: User | null }> = ({ user }) => {
    if (!user) {
        return <div className="p-6 text-center">Loading user data...</div>;
    }

    const isStudent = user.role === Role.STUDENT;

    if (isStudent) {
        return <StudentView user={user} />;
    } else {
        // Principal, Faculty, Staff get the admin view
        return <AdminView user={user} />;
    }
};

export default ApplicationsPage;