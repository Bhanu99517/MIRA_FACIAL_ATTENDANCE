

import React, { useState, useEffect, useMemo } from 'react';
import type { User, SBTETResult } from '../types';
import { Role } from '../types';
import { getAllSbtetResultsForPin, getUserByPin } from '../services';
import { Icons } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Modal } from './components.tsx';
import { useAppContext } from '../App';

const SummaryStatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 rounded-lg">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const AccordionItem: React.FC<{ result: SBTETResult; isActive: boolean; onToggle: () => void }> = ({ result, isActive, onToggle }) => {
    const isPass = result.status === 'Pass';
    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 overflow-hidden">
            <button onClick={onToggle} className="w-full flex justify-between items-center p-4 text-left">
                <span className="font-bold text-lg">Semester {result.semester}</span>
                <div className="flex items-center gap-4">
                     <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isPass ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                        {result.status}
                    </span>
                    <Icons.chevronDown className={`w-5 h-5 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isActive && (
                <div className="px-4 pb-4 animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold">Sub Code</th>
                                    <th className="px-4 py-2 text-left font-semibold">Subject Name</th>
                                    <th className="px-4 py-2 text-center font-semibold">Internal</th>
                                    <th className="px-4 py-2 text-center font-semibold">External</th>
                                    <th className="px-4 py-2 text-center font-semibold">Total</th>
                                    <th className="px-4 py-2 text-center font-semibold">Credits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {result.subjects.map(sub => (
                                    <tr key={sub.code}>
                                        <td className="px-4 py-2 font-mono">{sub.code}</td>
                                        <td className="px-4 py-2 font-medium">{sub.name}</td>
                                        <td className="px-4 py-2 text-center">{sub.internal}</td>
                                        <td className="px-4 py-2 text-center">{sub.external}</td>
                                        <td className="px-4 py-2 text-center font-bold">{sub.total}</td>
                                        <td className="px-4 py-2 text-center">{sub.credits}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};


// FIX: This component was missing its return statement, causing it to implicitly return 'void' and fail compilation. The JSX for the page has been added.
const SBTETResultsPage: React.FC<{ user: User }> = ({ user: initialUser }) => {
    const { user: currentUser } = useAppContext();
    const [pin, setPin] = useState(initialUser.role === Role.STUDENT ? initialUser.pin : '');
    const [results, setResults] = useState<SBTETResult[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchedUser, setSearchedUser] = useState<User | null>(initialUser.role === Role.STUDENT ? initialUser : null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

    const isAdmin = initialUser.role === Role.PRINCIPAL || initialUser.role === Role.FACULTY || initialUser.role === Role.HOD || initialUser.role === Role.SUPER_ADMIN;
    
    const summary = useMemo(() => {
        if (!results || results.length === 0) return null;

        const totalSgpa = results.reduce((sum, r) => sum + r.sgpa, 0);
        const totalCredits = results.reduce((sum, r) => sum + r.creditsEarned, 0);
        const totalBacklogs = results.reduce((sum, r) => {
            const failedSubjects = r.subjects.filter(s => s.total < 35).length;
            return sum + failedSubjects;
        }, 0);
        const cgpa = totalSgpa / results.length;
        const sgpaData = results.map(r => ({ name: `Sem ${r.semester}`, SGPA: r.sgpa }));

        return {
            cgpa: cgpa.toFixed(2),
            totalCredits,
            backlogs: totalBacklogs,
            sgpaData,
        }
    }, [results]);

    const handleDownloadPdf = () => {
        if (!results || !searchedUser || !summary) return;
        setIsDownloading(true);

        try {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('GOVERNMENT POLYTECHNIC, SANGAREDDY', 105, 20, { align: 'center' });
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text('Consolidated Statement of Marks', 105, 28, { align: 'center' });
            
            // Student Info
            autoTable(doc, {
                startY: 40,
                body: [
                    ['Student Name:', searchedUser.name, 'PIN:', searchedUser.pin],
                    ['Branch:', searchedUser.branch, 'Academic History']
                ],
                theme: 'plain'
            });

            // Summary
            autoTable(doc, {
                body: [
                    [{ content: 'Academic Summary', colSpan: 4, styles: { fontStyle: 'bold', fillColor: '#e2e8f0', textColor: '#000' } }],
                    ['Overall CGPA', summary.cgpa, 'Total Credits', summary.totalCredits],
                    ['Total Backlogs', summary.backlogs, '', ''],
                ],
                theme: 'grid',
                headStyles: { fillColor: [2, 132, 199] }
            });
            
            // Each semester's results
            results.forEach(result => {
                const tableColumn = ["Sub Code", "Subject Name", "Internal", "External", "Total", "Credits"];
                const tableRows = result.subjects.map(sub => [
                    sub.code, sub.name, sub.internal, sub.external, sub.total, sub.credits
                ]);
                autoTable(doc, {
                    head: [
                        [{ 
                            content: `Semester ${result.semester} (SGPA: ${result.sgpa.toFixed(2)}, Status: ${result.status})`, 
                            colSpan: 6, 
                            styles: { fontStyle: 'bold', fillColor: '#f1f5f9', textColor: '#0f172a', halign: 'left' } 
                        }],
                        tableColumn
                    ],
                    body: tableRows,
                    theme: 'grid',
                    headStyles: {
                        fillColor: '#0284c7',
                        textColor: '#ffffff',
                        fontStyle: 'bold',
                        halign: 'center',
                    },
                    bodyStyles: {
                        fillColor: '#ffffff',
                        textColor: '#1f2937',
                    },
                    alternateRowStyles: {
                        fillColor: '#f8fafc',
                    },
                    styles: {
                        lineColor: '#e2e8f0',
                        lineWidth: 0.1,
                        cellPadding: 2,
                    },
                    columnStyles: {
                        0: { cellWidth: 25, fontStyle: 'bold' }, // Sub Code
                        1: { cellWidth: 'auto' }, // Subject Name
                        2: { halign: 'center' }, // Internal
                        3: { halign: 'center' }, // External
                        4: { halign: 'center', fontStyle: 'bold' }, // Total
                        5: { halign: 'center' }, // Credits
                    },
                });
            });

            // Footer
            const pageCount = (doc.internal as any).getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, {align: 'center'});
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, doc.internal.pageSize.height - 10);
            }
            
            doc.save(`SBTET_Consolidated_${searchedUser.pin}.pdf`);

        } catch (e) {
            console.error("Failed to generate PDF", e);
            alert("An error occurred while generating the PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleFetchResult = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!pin || !searchedUser || !currentUser) {
             setError("Please enter a valid PIN for a student.");
             setResults(null);
             return;
        }
        setLoading(true);
        setError('');
        setResults(null);
        try {
            const data = await getAllSbtetResultsForPin(pin, currentUser);
            if (data && data.length > 0) {
                setResults(data);
                setActiveAccordion(data[data.length-1].semester); // Open last semester by default
            } else {
                setError(`No results found for PIN ${pin}.`);
            }
        } catch (err) {
            setError("Failed to fetch results. Please try again later.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (initialUser.role === Role.STUDENT) {
            handleFetchResult();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialUser]);

    const handlePinSearch = async (searchPin: string) => {
        setPin(searchPin.toUpperCase());
        if (searchPin.length >= 10 && currentUser) { // e.g. 23210-EC-001
            const foundUser = await getUserByPin(searchPin.toUpperCase(), currentUser);
            setSearchedUser(foundUser);
             if (!foundUser) {
                setError("Student with this PIN not found in your college.");
                setResults(null);
            } else {
                setError('');
            }
        } else {
            setSearchedUser(null);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Icons.results className="w-8 h-8 text-primary-500" />
                SBTET Results
            </h1>
            {isAdmin && (
                <form onSubmit={handleFetchResult} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Enter Student PIN..."
                        value={pin}
                        onChange={(e) => handlePinSearch(e.target.value)}
                        className="flex-grow p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <button type="submit" disabled={loading || !searchedUser} className="p-2 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-slate-400">
                        {loading ? 'Fetching...' : 'Get Results'}
                    </button>
                </form>
            )}
            {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
            {loading && !results && <p className="text-center py-10">Loading results...</p>}
            {results && searchedUser && summary && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{searchedUser.name}</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-mono">{searchedUser.pin}</p>
                            </div>
                            <button onClick={handleDownloadPdf} disabled={isDownloading} className="font-semibold text-sm py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
                                <Icons.download className="w-4 h-4" />
                                {isDownloading ? 'Downloading...' : 'Download as PDF'}
                            </button>
                        </div>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SummaryStatCard title="Overall CGPA" value={summary.cgpa} icon={Icons.reports} />
                            <SummaryStatCard title="Total Credits" value={summary.totalCredits} icon={Icons.checkCircle} />
                            <SummaryStatCard title="Backlogs" value={summary.backlogs} icon={Icons.xCircle} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-3">
                            {results.map(res => (
                                <AccordionItem key={res.id} result={res} isActive={activeAccordion === res.semester} onToggle={() => setActiveAccordion(prev => prev === res.semester ? null : res.semester)} />
                            ))}
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h3 className="font-bold text-lg mb-4">SGPA Trend</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={summary.sgpaData} style={{ colorScheme: 'light dark' }}>
                                    <XAxis dataKey="name" stroke="currentColor" opacity={0.6} fontSize={12} />
                                    <YAxis stroke="currentColor" opacity={0.6} fontSize={12} domain={[0, 10]} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #ccc)' }}
                                     />
                                    <Legend iconType="circle"/>
                                    <Bar dataKey="SGPA" fill="var(--primary-color, #3b82f6)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SBTETResultsPage;