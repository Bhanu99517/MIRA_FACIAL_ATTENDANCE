
import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getUsers, getAttendanceForDate, getAttendanceForDateRange } from '../services';
import type { User, AttendanceRecord } from '../types';
import { Role } from '../types';
import { Icons } from '../constants';
import { useAppContext } from '../App';

const BRANCH_OPTIONS = ['All Students', 'CS', 'EC', 'EEE', 'Faculty'];

const StudentGrid: React.FC<{ users: User[], attendanceMap: Map<string, AttendanceRecord> }> = ({ users, attendanceMap }) => (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {users.map(student => {
            const record = attendanceMap.get(student.id);
            const isPresent = record?.status === 'Present';
            const locationStatus = record?.location?.status;
            return (
                <div 
                    key={student.id} 
                    title={`${student.name} - ${isPresent ? `Present${record?.timestamp ? ` at ${record.timestamp}` : ''}${locationStatus ? ` (${locationStatus})` : ''}` : 'Absent'}`}
                    className={`relative h-12 w-12 flex items-center justify-center rounded-lg text-sm font-mono transition-all duration-200 border-2 ${isPresent ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800'}`}
                >
                    {student.pin.slice(-3)}
                    {locationStatus === 'On-Campus' && <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-800" title="On-Campus"></div>}
                    {locationStatus === 'Off-Campus' && <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-800" title="Off-Campus"></div>}
                </div>
            );
        })}
    </div>
);

const FacultyList: React.FC<{ users: User[], attendanceMap: Map<string, AttendanceRecord> }> = ({ users, attendanceMap }) => (
    <ul className="space-y-3">
        {users.map(faculty => {
            const record = attendanceMap.get(faculty.id);
            const status = record?.status || 'Absent';
            const locationStatus = record?.location?.status;
            return (
                 <li key={record?.id || faculty.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-4">
                        <img src={faculty.imageUrl} alt={faculty.name} className="h-11 w-11 rounded-full object-cover" />
                        <div>
                            <p className="font-semibold">{faculty.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{faculty.pin}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                            {status}
                        </span>
                        {status === 'Present' && (
                           <>
                             {record?.timestamp && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{record.timestamp}</p>}
                             {locationStatus && (
                                <p className={`flex items-center justify-end gap-1 text-xs mt-0.5 ${locationStatus === 'On-Campus' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    <Icons.location className="w-3 h-3"/>
                                    {locationStatus}
                                </p>
                             )}
                           </>
                        )}
                    </div>
                </li>
            );
        })}
    </ul>
);

const AttendanceLogView: React.FC<{ records: AttendanceRecord[] }> = ({ records }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {records.length > 0 ? records.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <img className="h-10 w-10 rounded-full object-cover" src={record.userAvatar} alt="" />
                                <div className="ml-4">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{record.userName}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">{record.userPin}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                                {record.status}
                             </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.location ? (
                                <span className={`flex items-center gap-1.5 ${record.location.status === 'On-Campus' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    <Icons.location className="w-4 h-4"/>
                                    {record.location.status}
                                </span>
                            ) : 'N/A'}
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-500">No attendance records found for the selected criteria.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);


const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (!percent || percent < 0.05) {
        return null;
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize="14">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


const ReportsPage: React.FC = () => {
    const { user } = useAppContext();
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [branchFilter, setBranchFilter] = useState('All Students');
    const [search, setSearch] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]); // For single day view
    const [logRecords, setLogRecords] = useState<AttendanceRecord[]>([]); // For date range view
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (user) {
            getUsers(user).then(setAllUsers);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        if (startDate === endDate) {
            getAttendanceForDate(endDate, user)
                .then(records => {
                    setAttendance(records);
                    setLogRecords([]); 
                })
                .finally(() => setLoading(false));
        } else {
            getAttendanceForDateRange(startDate, endDate, user)
                .then(records => {
                    setLogRecords(records);
                    setAttendance([]); 
                })
                .finally(() => setLoading(false));
        }
    }, [startDate, endDate, user]);

    const { filteredUsers, attendanceMap, presentCount, totalCount } = useMemo(() => {
        const isFacultyView = branchFilter === 'Faculty';
        
        let users = allUsers.filter(u => {
            if (isFacultyView) {
                return u.role === Role.FACULTY || u.role === Role.PRINCIPAL || u.role === Role.HOD;
            }
            if (branchFilter === 'All Students') {
                return u.role === Role.STUDENT;
            }
            return u.role === Role.STUDENT && u.branch === branchFilter;
        });
        
        if (search) {
            const normalizedSearch = search.toLowerCase().replace(/-/g, '');
            users = users.filter(u => 
                u.name.toLowerCase().includes(normalizedSearch) || 
                u.pin.toLowerCase().replace(/-/g, '').includes(normalizedSearch)
            );
        }

        const map = new Map<string, AttendanceRecord>(attendance.map(a => [a.userId, a]));
        const present = users.filter(u => map.has(u.id) && map.get(u.id)?.status === 'Present').length;
        
        return {
            filteredUsers: users,
            attendanceMap: map,
            presentCount: present,
            totalCount: users.length,
        };
    }, [allUsers, attendance, branchFilter, search]);

    const filteredLogRecords = useMemo(() => {
        // FIX: The original optimization logic here was flawed and caused a TypeScript error.
        // It incorrectly returned all records (including faculty) when "All Students" was selected.
        // Removing the optimization and relying on the correct filtering logic below ensures correctness.

        const isFacultyView = branchFilter === 'Faculty';
        // FIX: Explicitly type the Map to ensure TypeScript correctly infers the 'user' type later.
        const usersById = new Map<string, User>(allUsers.map(u => [u.id, u]));
        const normalizedSearch = search.toLowerCase().replace(/-/g, '');

        return logRecords.filter(record => {
            const user = usersById.get(record.userId);
            if (!user) return false;

            const branchMatch = isFacultyView
                ? (user.role === Role.FACULTY || user.role === Role.PRINCIPAL || user.role === Role.HOD)
                : branchFilter === 'All Students'
                    ? user.role === Role.STUDENT
                    : user.role === Role.STUDENT && user.branch === branchFilter;

            if (!branchMatch) return false;

            if (search) {
                const searchMatch = user.name.toLowerCase().includes(normalizedSearch) ||
                                    user.pin.toLowerCase().replace(/-/g, '').includes(normalizedSearch);
                return searchMatch;
            }

            return true;
        });
    }, [logRecords, allUsers, branchFilter, search]);


    const pieData = [
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: totalCount - presentCount },
    ];
    const COLORS = ['#10B981', '#EF4444'];

    const handleExport = async () => {
        if (!user) return;
        setIsExporting(true);
        try {
            const recordsInRange = await getAttendanceForDateRange(startDate, endDate, user);
            const usersById = new Map<string, User>(allUsers.map(u => [u.id, u]));
            const isFacultyView = branchFilter === 'Faculty';
            const normalizedSearch = search.toLowerCase().replace(/-/g, '');

            const filteredRecords = recordsInRange.filter((record: AttendanceRecord) => {
                const user = usersById.get(record.userId);
                if (!user) return false;
                const branchMatch = isFacultyView ? (user.role === Role.FACULTY || user.role === Role.PRINCIPAL || user.role === Role.HOD) : branchFilter === 'All Students' ? user.role === Role.STUDENT : user.role === Role.STUDENT && user.branch === branchFilter;
                if (!branchMatch) return false;
                if (search) {
                    const searchMatch = user.name.toLowerCase().includes(normalizedSearch) || user.pin.toLowerCase().replace(/-/g, '').includes(normalizedSearch);
                    return searchMatch;
                }
                return true;
            });
            
            if (filteredRecords.length === 0) {
                alert("No data to export for the selected filters.");
                return;
            }

            const csvHeader = ["Date", "Name", "PIN", "Status", "Timestamp", "Location Status", "Coordinates"];
            const csvRows = filteredRecords.map(rec => [rec.date, `"${rec.userName.replace(/"/g, '""')}"`, rec.userPin, rec.status, rec.timestamp || 'N/A', rec.location?.status || 'N/A', rec.location?.coordinates || 'N/A'].join(','));
            const csvContent = [csvHeader.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `mira_attendance_report_${startDate}_to_${endDate}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to export CSV:", error);
            alert("An error occurred during export. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Report</h1>
                    <p className="text-slate-500 dark:text-slate-400">View and export daily or historical attendance records.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4 flex-wrap">
                 <label htmlFor="start-date" className="text-sm font-medium text-slate-500 dark:text-slate-400 sr-only">Start Date</label>
                 <input 
                    id="start-date"
                    type="date" 
                    value={startDate} 
                    onChange={e => {
                        const newStartDate = e.target.value;
                        setStartDate(newStartDate);
                        if (new Date(newStartDate) > new Date(endDate)) {
                            setEndDate(newStartDate);
                        }
                    }} 
                    className="p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                />
                 <label htmlFor="end-date" className="text-sm font-medium text-slate-500 dark:text-slate-400 sr-only">End Date</label>
                 <input 
                    id="end-date"
                    type="date" 
                    value={endDate} 
                    onChange={e => {
                        const newEndDate = e.target.value;
                        setEndDate(newEndDate);
                        if (new Date(newEndDate) < new Date(startDate)) {
                            setStartDate(newEndDate);
                        }
                    }}
                    className="p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                />
                <select 
                    value={branchFilter} 
                    onChange={e => setBranchFilter(e.target.value)}
                    className="p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                    {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                 <input 
                    type="text" 
                    placeholder="Search by Name/PIN..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-grow p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button onClick={handleExport} disabled={isExporting} className="p-2 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow-lg hover:shadow-primary-500/50 disabled:bg-primary-800 disabled:cursor-not-allowed">
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {startDate === endDate ? (
                    <>
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{branchFilter} Attendance for {new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</h3>
                            {loading ? <p>Loading...</p> : (
                                branchFilter === 'Faculty' 
                                    ? <FacultyList users={filteredUsers} attendanceMap={attendanceMap} />
                                    : <StudentGrid users={filteredUsers} attendanceMap={attendanceMap} />
                            )}
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
                            <h3 className="font-bold text-center text-lg text-gray-800 dark:text-gray-100">Daily Attendance Ratio</h3>
                            <div className="text-center">
                                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{presentCount}</span>
                                <span className="text-xl text-gray-500 dark:text-gray-400"> / {totalCount} Present</span>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} labelLine={false} label={renderCustomizedLabel}>
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={''} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', border: '1px solid #ddd', borderRadius: '10px' }}/>
                                    <Legend iconType="circle"/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">
                            Attendance Log from {new Date(startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })} to {new Date(endDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                        </h3>
                        {loading ? <p>Loading log...</p> : <AttendanceLogView records={filteredLogRecords} />}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsPage;